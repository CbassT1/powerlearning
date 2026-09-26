const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_powerlearning_2026';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ error: 'Se requiere un token de autenticación (Falta cabecera Authorization)' });
    }

    const token = authHeader.split(' ')[1]; // Espera formato: "Bearer <token>"

    if (!token) {
        return res.status(403).json({ error: 'Formato de token inválido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Inyecta los datos del usuario (id, role) en la request
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware adicional para validar si el rol es suficiente
const verifyRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos de rol para realizar esta acción' });
        }
        next();
    };
};

module.exports = { verifyToken, verifyRole };