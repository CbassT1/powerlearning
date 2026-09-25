const pool = require('../config/db');

const getCourses = async (req, res) => {
    try {
        const { role } = req.query;
        // Hacemos un JOIN para cruzar la tabla de cursos con la de usuarios y obtener el nombre del profesor
        let query = "SELECT c.*, u.name as professor_name FROM courses c LEFT JOIN users u ON c.creator_id = u.id WHERE c.status = 'approved'";
        if (role === 'admin') {
            query = "SELECT c.*, u.name as professor_name FROM courses c LEFT JOIN users u ON c.creator_id = u.id";
        }
        
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error("🔴 ERROR AL OBTENER CURSOS:", error);
        res.status(500).json({ error: 'Error al obtener los cursos' });
    }
};

const createCourse = async (req, res) => {
    const { title, description, role, image_url, estimated_time, creator_id, subject } = req.body;
    if (role !== 'profesor' && role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    
    try {
        await pool.query(
            'INSERT INTO courses (title, description, image_url, estimated_time, creator_id, subject) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, image_url, estimated_time, creator_id, subject]
        );
        res.status(201).json({ mensaje: 'Curso creado y pendiente de revisión' });
    } catch (error) {
        console.error('🔴 ERROR AL CREAR CURSO:', error);
        res.status(500).json({ error: 'Error al crear el curso' });
    }
};

const suspendCourse = async (req, res) => {
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        await pool.query("UPDATE courses SET status = 'suspended' WHERE id = ?", [req.params.id]);
        res.json({ mensaje: 'Curso suspendido exitosamente' });
    } catch (error) {
        console.error('🔴 ERROR AL SUSPENDER CURSO:', error);
        res.status(500).json({ error: 'Error al suspender el curso' });
    }
};

const approveCourse = async (req, res) => {
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    
    try {
        await pool.query("UPDATE courses SET status = 'approved', rejection_reason = NULL WHERE id = ?", [req.params.id]);
        res.json({ mensaje: 'Curso aprobado' });
    } catch (error) {
        console.error('🔴 ERROR AL APROBAR CURSO:', error);
        res.status(500).json({ error: 'Error al aprobar el curso' });
    }
};

const rejectCourse = async (req, res) => {
    const { role, reason } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        await pool.query("UPDATE courses SET status = 'rejected', rejection_reason = ? WHERE id = ?", [reason || 'No cumple los lineamientos', req.params.id]);
        res.json({ mensaje: 'Curso rechazado' });
    } catch (error) {
        console.error('🔴 ERROR AL RECHAZAR CURSO:', error);
        res.status(500).json({ error: 'Error al rechazar el curso' });
    }
};

// NUEVO: Eliminar curso permanentemente (Admin)
const deleteCourse = async (req, res) => {
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        await pool.query("DELETE FROM enrollments WHERE course_id = ?", [req.params.id]);
        await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
        res.json({ mensaje: 'Curso eliminado permanentemente' });
    } catch (error) {
        console.error('🔴 ERROR AL ELIMINAR CURSO:', error);
        res.status(500).json({ error: 'Error al eliminar el curso' });
    }
};

const enrollInCourse = async (req, res) => {
    const { userId, courseId } = req.body;
    try {
        const [existing] = await pool.query('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);
        if (existing.length > 0) return res.status(400).json({ error: 'Ya te encuentras inscrito en este curso' });

        await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [userId, courseId]);
        res.json({ mensaje: 'Inscripción exitosa' });
    } catch (error) {
        console.error('🔴 ERROR AL INSCRIBIRSE:', error);
        res.status(500).json({ error: 'Error interno en el servidor' });
    }
};

const getMyCourses = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.query;
    
    try {
        if (role === 'profesor') {
            const [rows] = await pool.query('SELECT * FROM courses WHERE creator_id = ?', [userId]);
            res.json(rows);
        } else {
            const [rows] = await pool.query(
                'SELECT c.* FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.user_id = ?',
                [userId]
            );
            res.json(rows);
        }
    } catch (error) {
        console.error('🔴 ERROR AL OBTENER MIS CURSOS:', error);
        res.status(500).json({ error: 'Error al cargar tus cursos' });
    }
};

const updateCourse = async (req, res) => {
    const { title, description, image_url, estimated_time, subject, role } = req.body;
    if (role !== 'profesor' && role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    
    try {
        // Al editar, lo regresamos a status 'pending' para que el admin lo vuelva a aprobar
        await pool.query(
            "UPDATE courses SET title = ?, description = ?, image_url = ?, estimated_time = ?, subject = ?, status = 'pending', rejection_reason = NULL WHERE id = ?",
            [title, description, image_url, estimated_time, subject, req.params.id]
        );
        res.json({ mensaje: 'Curso actualizado y enviado a revisión' });
    } catch (error) {
        console.error('🔴 ERROR AL EDITAR CURSO:', error);
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
};

const unenrollFromCourse = async (req, res) => {
    const { userId, courseId } = req.body;
    try {
        await pool.query('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);
        res.json({ mensaje: 'Te has dado de baja del curso' });
    } catch (error) {
        console.error('🔴 ERROR AL DAR DE BAJA:', error);
        res.status(500).json({ error: 'Error al cancelar inscripción' });
    }
};

module.exports = { getCourses, createCourse, approveCourse, rejectCourse, deleteCourse, enrollInCourse, getMyCourses, suspendCourse, updateCourse, unenrollFromCourse };