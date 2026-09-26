process.env.JWT_SECRET = 'secreto_de_prueba_para_jest';

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
    query: jest.fn().mockResolvedValue([[]]) 
}));

describe('Pruebas de Autenticación y Usuarios', () => {
    let tokenAdmin, tokenAlumno;

    beforeAll(() => {
        tokenAdmin = jwt.sign({ userId: 1, role: 'admin' }, process.env.JWT_SECRET);
        tokenAlumno = jwt.sign({ userId: 2, role: 'alumno' }, process.env.JWT_SECRET);
    });

    beforeEach(() => { jest.clearAllMocks(); });

    // --- REGISTRO Y LOGIN ---
    it('Debería registrar un usuario nuevo', async () => {
        pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 2 }]); 
        const res = await request(app).post('/api/auth/register').send({ name: 'User', email: 'test@test.com', password: '123' });
        expect(res.statusCode).toBe(201);
    });

    it('Debería manejar errores de DB en registro', async () => {
        pool.query.mockRejectedValueOnce(new Error('Fallo de DB')); 
        const res = await request(app).post('/api/auth/register').send({ name: 'User', email: 'error@test.com', password: '123' });
        expect(res.statusCode).toBe(500);
    });

    it('Debería bloquear login a cuenta suspendida', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1, email: 'bloqueado@test.com', status: 'blocked', block_reason: 'Spam' }]]);
        const res = await request(app).post('/api/auth/login').send({ email: 'bloqueado@test.com', password: '123' });
        expect(res.statusCode).toBe(403);
    });

    it('Debería rechazar login por usuario inexistente', async () => {
        pool.query.mockResolvedValueOnce([[]]);
        const res = await request(app).post('/api/auth/login').send({ email: 'noexiste@test.com', password: '123' });
        expect(res.statusCode).toBe(401);
    });

    // --- PERFIL DE USUARIO ---
    it('Debería obtener usuario por ID', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1, name: 'Juan' }]]);
        const res = await request(app).get('/api/auth/users/1').set('Authorization', `Bearer ${tokenAlumno}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería devolver 404 si el usuario no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]);
        const res = await request(app).get('/api/auth/users/999').set('Authorization', `Bearer ${tokenAlumno}`);
        expect(res.statusCode).toBe(404);
    });

    it('Debería actualizar un perfil', async () => {
        const res = await request(app).put('/api/auth/users/1').set('Authorization', `Bearer ${tokenAlumno}`).send({ name: 'Nuevo' });
        expect(res.statusCode).toBe(200);
    });

    it('Debería cambiar la contraseña', async () => {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('vieja', salt);
        pool.query.mockResolvedValueOnce([[{ password: hash }]]);
        const res = await request(app).put('/api/auth/users/2/password').set('Authorization', `Bearer ${tokenAlumno}`).send({ currentPassword: 'vieja', newPassword: 'nueva' });
        expect(res.statusCode).toBe(200);
    });

    it('Debería fallar cambio de contraseña si la actual es incorrecta', async () => {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('vieja', salt);
        pool.query.mockResolvedValueOnce([[{ password: hash }]]);
        const res = await request(app).put('/api/auth/users/2/password').set('Authorization', `Bearer ${tokenAlumno}`).send({ currentPassword: 'mala', newPassword: 'nueva' });
        expect(res.statusCode).toBe(401);
    });

    it('Debería fallar cambio de contraseña si el usuario no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]);
        const res = await request(app).put('/api/auth/users/2/password').set('Authorization', `Bearer ${tokenAlumno}`).send({ currentPassword: 'vieja', newPassword: 'nueva' });
        expect(res.statusCode).toBe(404);
    });

    // --- FUNCIONES DE ADMIN ---
    it('Debería obtener usuarios (Admin)', async () => {
        const res = await request(app).get('/api/auth/users').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería bloquear un usuario (Admin)', async () => {
        const res = await request(app).delete('/api/auth/users/2').set('Authorization', `Bearer ${tokenAdmin}`).send({ reason: 'Mal comportamiento' });
        expect(res.statusCode).toBe(200);
    });

    it('Debería desbloquear un usuario (Admin)', async () => {
        const res = await request(app).put('/api/auth/users/2/unblock').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    it('Debería editar rol de usuario (Admin)', async () => {
        const res = await request(app).put('/api/auth/users/2/admin').set('Authorization', `Bearer ${tokenAdmin}`).send({ name: 'Editado', userRole: 'profesor' });
        expect(res.statusCode).toBe(200);
    });

    it('Debería eliminar usuario de forma permanente (Admin)', async () => {
        const res = await request(app).delete('/api/auth/users/2/hard').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    // --- APELACIONES ---
    it('Debería enviar una apelación exitosa', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // Usuario existe
        const res = await request(app).post('/api/auth/appeals').send({ email: 'test@test.com', reason: 'Por favor' });
        expect(res.statusCode).toBe(200);
    });

    it('Debería rechazar apelación si el usuario no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]); // Usuario NO existe
        const res = await request(app).post('/api/auth/appeals').send({ email: 'no@test.com', reason: 'Por favor' });
        expect(res.statusCode).toBe(404);
    });

    it('Debería obtener apelaciones pendientes (Admin)', async () => {
        const res = await request(app).get('/api/auth/appeals').set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });

    // --- SIMULACIÓN DE ERRORES DEL SERVIDOR (CATCH BLOCKS) ---
    const endpointsErrores = [
        { method: 'get', url: '/api/auth/users' },
        { method: 'get', url: '/api/auth/users/1' },
        { method: 'put', url: '/api/auth/users/1' },
        { method: 'delete', url: '/api/auth/users/1' },
        { method: 'delete', url: '/api/auth/users/1/hard' },
        { method: 'put', url: '/api/auth/users/1/unblock' },
        { method: 'put', url: '/api/auth/users/1/admin' },
        { method: 'put', url: '/api/auth/users/1/password' },
        { method: 'post', url: '/api/auth/appeals' },
        { method: 'get', url: '/api/auth/appeals' },
    ];

    endpointsErrores.forEach(ep => {
        it(`Debería manejar error 500 en ${ep.method.toUpperCase()} ${ep.url}`, async () => {
            pool.query.mockRejectedValueOnce(new Error('Falla catastrófica'));
            const req = request(app)[ep.method](ep.url).set('Authorization', `Bearer ${tokenAdmin}`);
            if (ep.method === 'post' || ep.method === 'put') req.send({});
            const res = await req;
            expect(res.statusCode).toBe(500);
        });
    });
});