const express = require('express');
const router = express.Router();
const { register, login, getUsers, getUserById, deleteUser, updateProfile, submitAppeal, getAppeals, hardDeleteUser, unblockUser, adminUpdateUser, changePassword  } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateProfile);
router.post('/appeals', submitAppeal);
router.get('/appeals', getAppeals);
router.delete('/users/:id/hard', hardDeleteUser);
router.put('/users/:id/unblock', unblockUser);
router.put('/users/:id/admin', adminUpdateUser);
router.put('/users/:id/password', changePassword);
module.exports = router;