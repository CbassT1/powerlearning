const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = role || 'user';

        const [result] = await pool.query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, userRole]
        );

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente', userId: result.insertId, role: userRole });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor de base de datos' });
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
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ mensaje: 'Inicio de sesión exitoso', token, userId: user.id, email: user.email, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor de base de datos' });
    }
};

const getUsers = async (req, res) => {
    const { role } = req.query;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const [rows] = await pool.query('SELECT id, email, role FROM users');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        await pool.query('DELETE FROM enrollments WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ mensaje: 'Usuario eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

const updateProfile = async (req, res) => {
    const { id } = req.params;
    const { name, interests, photo_url } = req.body;
    try {
        await pool.query(
            'UPDATE users SET name = ?, interests = ?, photo_url = ? WHERE id = ?',
            [name, interests, photo_url, id]
        );
        res.json({ mensaje: 'Perfil actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

module.exports = { register, login, getUsers, deleteUser, updateProfile };
