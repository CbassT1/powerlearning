const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

// Interceptamos la base de datos para pruebas aisladas
jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

describe('Pruebas del Módulo de Cursos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/courses', () => {
        it('Debería obtener el catálogo de cursos', async () => {
            const mockCourses = [
                { id: 1, title: 'Introducción a DevOps', description: 'Desc 1' },
                { id: 2, title: 'Backend Escalable', description: 'Desc 2' }
            ];
            pool.query.mockResolvedValueOnce([mockCourses]);

            const res = await request(app).get('/api/courses');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].title).toBe('Introducción a DevOps');
        });

        it('Debería manejar errores del servidor al obtener cursos', async () => {
            pool.query.mockRejectedValueOnce(new Error('Fallo de conexión'));
            const res = await request(app).get('/api/courses');
            expect(res.statusCode).toBe(500);
        });
    });

    describe('POST /api/courses/enroll', () => {
        it('Debería registrar una solicitud de inscripción exitosa', async () => {
            pool.query.mockResolvedValueOnce([[]]); // No hay inscripciones previas
            pool.query.mockResolvedValueOnce([{ insertId: 1 }]); // Éxito en el insert

            const res = await request(app)
                .post('/api/courses/enroll')
                .send({ userId: 1, courseId: 2 });

            expect(res.statusCode).toBe(201);
            expect(res.body.mensaje).toBe('Solicitud de inscripción enviada correctamente');
        });

        it('Debería rechazar la solicitud si faltan parámetros', async () => {
            const res = await request(app)
                .post('/api/courses/enroll')
                .send({ userId: 1 }); // Omitimos el courseId intencionalmente

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Faltan datos de inscripción');
        });

        it('Debería rechazar si el usuario ya solicitó entrar al curso', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 1, user_id: 1, course_id: 2 }]]);

            const res = await request(app)
                .post('/api/courses/enroll')
                .send({ userId: 1, courseId: 2 });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Ya has solicitado inscripción a este curso');
        });

        it('Debería manejar errores de base de datos durante la inscripción', async () => {
            pool.query.mockRejectedValueOnce(new Error('Fallo de escritura'));
            const res = await request(app)
                .post('/api/courses/enroll')
                .send({ userId: 1, courseId: 2 });
            expect(res.statusCode).toBe(500);
        });
    });
});