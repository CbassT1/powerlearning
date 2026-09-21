const express = require('express');
const router = express.Router();
const { register, login, getUsers, deleteUser, updateProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id', updateProfile);

module.exports = router;