const pool = require('../config/db');

const getCourses = async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT * FROM courses WHERE status = "approved"';
        if (role === 'admin') query = 'SELECT * FROM courses';
        
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error("🔴 ERROR EXACTO DE MYSQL:", error);
        res.status(500).json({ error: 'Error al obtener los cursos' });
    }
};

const enrollCourse = async (req, res) => {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) return res.status(400).json({ error: 'Faltan datos' });

    try {
        const [existing] = await pool.query('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);
        if (existing.length > 0) return res.status(400).json({ error: 'Ya has solicitado inscripción a este curso' });

        await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [userId, courseId]);
        res.status(201).json({ mensaje: 'Solicitud enviada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error de base de datos' });
    }
};

const createCourse = async (req, res) => {
    const { title, description, role, image_url, estimated_time } = req.body;
    if (role !== 'profesor') return res.status(403).json({ error: 'Acceso denegado' });
    if (!title || !description) return res.status(400).json({ error: 'Faltan datos obligatorios' });

    try {
        await pool.query(
            'INSERT INTO courses (title, description, image_url, estimated_time) VALUES (?, ?, ?, ?)',
            [title, description, image_url, estimated_time]
        );
        res.status(201).json({ mensaje: 'Curso enviado para aprobación del administrador' });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar el curso' });
    }
};

const approveCourse = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden aprobar' });

    try {
        await pool.query('UPDATE courses SET status = "approved" WHERE id = ?', [id]);
        res.json({ mensaje: 'Curso aprobado y publicado en el catálogo' });
    } catch (error) {
        res.status(500).json({ error: 'Error al aprobar' });
    }
};

const deleteCourse = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    
    try {
        await pool.query('DELETE FROM enrollments WHERE course_id = ?', [id]);
        await pool.query('DELETE FROM courses WHERE id = ?', [id]);
        res.json({ mensaje: 'Curso eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar curso' });
    }
};

module.exports = { getCourses, enrollCourse, createCourse, approveCourse, deleteCourse };