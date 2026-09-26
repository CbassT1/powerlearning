const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/appeals', authController.submitAppeal);
router.put('/users/:id/password', verifyToken, authController.changePassword);
router.put('/users/:id', verifyToken, authController.updateProfile);
router.get('/users/:id', verifyToken, authController.getUserById);
router.get('/users', verifyToken, verifyRole(['admin']), authController.getUsers);
router.delete('/users/:id', verifyToken, verifyRole(['admin']), authController.deleteUser);
router.delete('/users/:id/hard', verifyToken, verifyRole(['admin']), authController.hardDeleteUser);
router.put('/users/:id/unblock', verifyToken, verifyRole(['admin']), authController.unblockUser);
router.put('/users/:id/admin', verifyToken, verifyRole(['admin']), authController.adminUpdateUser);
router.get('/appeals', verifyToken, verifyRole(['admin']), authController.getAppeals);

module.exports = router;