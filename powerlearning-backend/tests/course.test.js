process.env.JWT_SECRET = 'secreto_de_prueba_para_jest';

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
    query: jest.fn().mockResolvedValue([[]])
}));

describe('Pruebas del Módulo de Cursos', () => {
    let tokenAlumno, tokenAdmin, tokenProfe;

    beforeAll(() => {
        tokenAlumno = jwt.sign({ userId: 1, role: 'alumno' }, process.env.JWT_SECRET);
        tokenAdmin = jwt.sign({ userId: 2, role: 'admin' }, process.env.JWT_SECRET);
        tokenProfe = jwt.sign({ userId: 3, role: 'profesor' }, process.env.JWT_SECRET);
    });

    beforeEach(() => { jest.clearAllMocks(); });

    it('Debería obtener el catálogo de cursos (Público)', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1, title: 'Curso A' }]]);
        const res = await request(app).get('/api/courses');
        expect(res.statusCode).toBe(200);
    });

    it('Debería obtener el catálogo completo (Admin)', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1, title: 'Curso A' }]]);
        const res = await request(app).get('/api/courses?role=admin').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería crear un curso (Profesor)', async () => {
        const res = await request(app).post('/api/courses').set('Authorization', `Bearer ${tokenProfe}`).send({ title: 'React 101' });
        expect(res.statusCode).toBe(201);
    });

    it('Debería actualizar un curso existente', async () => {
        const res = await request(app).put('/api/courses/1').set('Authorization', `Bearer ${tokenProfe}`).send({ title: 'Nuevo Título' });
        expect(res.statusCode).toBe(200);
    });

    it('Debería eliminar un curso (Admin)', async () => {
        const res = await request(app).delete('/api/courses/1').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería aprobar un curso (Admin)', async () => {
        const res = await request(app).put('/api/courses/1/approve').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería rechazar un curso (Admin)', async () => {
        const res = await request(app).put('/api/courses/1/reject').set('Authorization', `Bearer ${tokenAdmin}`).send({ reason: 'Falta temario' });
        expect(res.statusCode).toBe(200);
    });

    it('Debería suspender un curso (Admin)', async () => {
        const res = await request(app).put('/api/courses/1/suspend').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería inscribirse en un curso (Alumno)', async () => {
        const res = await request(app).post('/api/courses/enroll').set('Authorization', `Bearer ${tokenAlumno}`).send({ userId: 1, courseId: 1 });
        expect(res.statusCode).toBe(200);
    });

    it('Debería rechazar si el usuario ya está inscrito (Alumno)', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // Finge que ya existe la inscripción
        const res = await request(app).post('/api/courses/enroll').set('Authorization', `Bearer ${tokenAlumno}`).send({ userId: 1, courseId: 1 });
        expect(res.statusCode).toBe(400);
    });

    it('Debería dar de baja a un alumno de un curso', async () => {
        const res = await request(app).post('/api/courses/unenroll').set('Authorization', `Bearer ${tokenAlumno}`).send({ userId: 1, courseId: 1 });
        expect(res.statusCode).toBe(200);
    });

    it('Debería obtener mis cursos como alumno', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1, title: 'Mi Curso' }]]);
        const res = await request(app).get('/api/courses/my-courses/1').set('Authorization', `Bearer ${tokenAlumno}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería obtener mis cursos como profesor', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1, title: 'Mi Curso' }]]);
        const res = await request(app).get('/api/courses/my-courses/3?role=profesor').set('Authorization', `Bearer ${tokenProfe}`);
        expect(res.statusCode).toBe(200);
    });

    // --- SIMULACIÓN DE ERRORES DEL SERVIDOR (CATCH BLOCKS) ---
    const endpointsErrores = [
        { method: 'get', url: '/api/courses' },
        { method: 'post', url: '/api/courses' },
        { method: 'put', url: '/api/courses/1' },
        { method: 'delete', url: '/api/courses/1' },
        { method: 'put', url: '/api/courses/1/approve' },
        { method: 'put', url: '/api/courses/1/reject' },
        { method: 'put', url: '/api/courses/1/suspend' },
        { method: 'post', url: '/api/courses/enroll' },
        { method: 'post', url: '/api/courses/unenroll' },
        { method: 'get', url: '/api/courses/my-courses/1' }
    ];

        endpointsErrores.forEach(ep => {
                it(`Debería manejar error 500 en ${ep.method.toUpperCase()} ${ep.url}`, async () => {
                    pool.query.mockRejectedValueOnce(new Error('Falla de base de datos'));
                    // Usamos tokenAlumno para las rutas de inscripción y tokenAdmin para el resto
                    const tokenAUsar = ep.url.includes('enroll') || ep.url.includes('my-courses') ? tokenAlumno : tokenAdmin;
                    const req = request(app)[ep.method](ep.url).set('Authorization', `Bearer ${tokenAUsar}`);
                    if (ep.method === 'post' || ep.method === 'put') req.send({});
                    const res = await req;
                    expect(res.statusCode).toBe(500);
                });
            });
});