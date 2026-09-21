const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

describe('Pruebas de Autenticación', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('Debería registrar un usuario nuevo', async () => {
            pool.query.mockResolvedValueOnce([[]]); 
            pool.query.mockResolvedValueOnce([{ insertId: 2 }]); 

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'nuevo@powerlearning.com', password: '123', role: 'user' });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('userId');
        });

        it('Debería rechazar si faltan datos', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'sinpassword@powerlearning.com' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Email y contraseña son obligatorios');
        });

        it('Debería rechazar si el usuario ya está registrado', async () => {
            pool.query.mockResolvedValueOnce([[{ email: 'nuevo@powerlearning.com' }]]); 

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'nuevo@powerlearning.com', password: '123' });

            expect(res.statusCode).toBe(400);
        });

        it('Debería manejar errores de base de datos en registro', async () => {
            pool.query.mockRejectedValueOnce(new Error('DB Error'));

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'error@powerlearning.com', password: '123' });

            expect(res.statusCode).toBe(500);
        });
    });

    describe('POST /api/auth/login', () => {
        it('Debería iniciar sesión correctamente y devolver un JWT', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123', salt);

            pool.query.mockResolvedValueOnce([[{ 
                id: 1, 
                email: 'login@powerlearning.com', 
                password: hashedPassword, 
                role: 'admin' 
            }]]);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@powerlearning.com', password: '123' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('Debería rechazar si el usuario no existe', async () => {
            pool.query.mockResolvedValueOnce([[]]); 

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'noexiste@powerlearning.com', password: '123' });

            expect(res.statusCode).toBe(401);
        });

        it('Debería rechazar si la contraseña es incorrecta', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123', salt);

            pool.query.mockResolvedValueOnce([[{ 
                id: 1, 
                email: 'login@powerlearning.com', 
                password: hashedPassword 
            }]]);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@powerlearning.com', password: 'passwordIncorrecto' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /', () => {
        it('Debería responder el endpoint de salud de la API', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toBe(200);
            expect(res.body.mensaje).toContain('funcionando');
        });
    });
});