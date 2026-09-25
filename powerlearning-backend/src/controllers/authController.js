const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
    const { email, password, role, name } = req.body;
    
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (nombre, email o contraseña)' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya está registrado con este correo' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = role || 'alumno';

        await pool.query(
            'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, userRole, name]
        );
        res.status(201).json({ mensaje: 'Cuenta creada exitosamente' });
    } catch (error) {
        console.error('ERROR EN REGISTRO:', error);
        res.status(500).json({ error: 'Error interno en el servidor' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = rows[0];

        if (user.status === 'blocked') {
            return res.status(403).json({ 
                error: 'Cuenta suspendida', 
                isBlocked: true, 
                reason: user.block_reason 
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, userId: user.id, email: user.email, role: user.role, name: user.name, photo_url: user.photo_url, interests: user.interests });
    } catch (error) {
        console.error('🔴 ERROR EN LOGIN:', error);
        res.status(500).json({ error: 'Error interno en el servidor' });
    }
};

const getUsers = async (req, res) => {
    const { role } = req.query;
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    try {
        const [rows] = await pool.query('SELECT id, email, role, name, photo_url, interests, status, block_reason FROM users');
        res.json(rows);
    } catch (error) {
        console.error('ERROR AL OBTENER USUARIOS:', error);
        res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
    }
};

const getUserById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, email, role, name, photo_url, interests, status, block_reason FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('ERROR AL OBTENER DETALLE DE USUARIO:', error);
        res.status(500).json({ error: 'Error al obtener los detalles del usuario' });
    }
};

const deleteUser = async (req, res) => {
    const { reason } = req.body;
    try {
        await pool.query(
            "UPDATE users SET status = 'blocked', block_reason = ? WHERE id = ?", 
            [reason || 'Violación de los términos de servicio', req.params.id]
        );
        res.json({ mensaje: 'Usuario bloqueado exitosamente' });
    } catch (error) {
        console.error('🔴 ERROR AL BLOQUEAR USUARIO:', error);
        res.status(500).json({ error: 'Error al bloquear el usuario' });
    }
};

const updateProfile = async (req, res) => {
    const { name, interests, photo_url } = req.body;
    try {
        await pool.query(
            'UPDATE users SET name = ?, interests = ?, photo_url = ? WHERE id = ?', 
            [name, interests, photo_url, req.params.id]
        );
        res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('ERROR AL ACTUALIZAR PERFIL:', error);
        res.status(500).json({ error: 'Error al actualizar el perfil en la base de datos' });
    }
};

// --- NUEVAS FUNCIONES FASE 1 ---

const submitAppeal = async (req, res) => {
    const { email, reason } = req.body;
    try {
        const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        
        await pool.query(
            "INSERT INTO appeals (user_id, email, reason) VALUES (?, ?, ?)",
            [users[0].id, email, reason]
        );
        res.json({ mensaje: "Apelación enviada al administrador" });
    } catch (error) {
        console.error("🔴 ERROR AL ENVIAR APELACIÓN:", error);
        res.status(500).json({ error: "Error al guardar la apelación" });
    }
};

const getAppeals = async (req, res) => {
    const { role } = req.query;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const [rows] = await pool.query("SELECT * FROM appeals WHERE status = 'pending'");
        res.json(rows);
    } catch (error) {
        console.error("🔴 ERROR AL OBTENER APELACIONES:", error);
        res.status(500).json({ error: "Error al cargar el buzón" });
    }
};

const hardDeleteUser = async (req, res) => {
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        // Debemos borrar en cascada manualmente para evitar errores de llave foránea
        await pool.query("DELETE FROM enrollments WHERE user_id = ?", [req.params.id]);
        await pool.query("DELETE FROM appeals WHERE user_id = ?", [req.params.id]);
        await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ mensaje: "Usuario eliminado de la base de datos permanentemente" });
    } catch (error) {
        console.error("🔴 ERROR HARD DELETE:", error);
        res.status(500).json({ error: "Error al eliminar el usuario" });
    }
};

 const unblockUser = async (req, res) => {
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        await pool.query("UPDATE users SET status = 'active', block_reason = NULL WHERE id = ?", [req.params.id]);
        await pool.query("DELETE FROM appeals WHERE user_id = ?", [req.params.id]); // Limpia el buzón automáticamente
        res.json({ mensaje: "Usuario desbloqueado exitosamente" });
    } catch (error) {
        console.error("🔴 ERROR AL DESBLOQUEAR:", error);
        res.status(500).json({ error: "Error al reactivar el usuario" });
    }
};

const adminUpdateUser = async (req, res) => {
    const { role: adminRole, name, userRole } = req.body; 
    if (adminRole !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    
    try {
        await pool.query(
            'UPDATE users SET name = ?, role = ? WHERE id = ?',
            [name, userRole, req.params.id]
        );
        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('🔴 ERROR AL ACTUALIZAR COMO ADMIN:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

// Cambio de Contraseña (Para todos los usuarios)
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const validPassword = await bcrypt.compare(currentPassword, rows[0].password);
        if (!validPassword) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);
        res.json({ mensaje: 'Contraseña actualizada de forma segura' });
    } catch (error) {
        console.error('🔴 ERROR AL CAMBIAR CONTRASEÑA:', error);
        res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
};

module.exports = { register, login, getUsers, getUserById, deleteUser, updateProfile, submitAppeal, getAppeals, hardDeleteUser, unblockUser, adminUpdateUser, changePassword };
