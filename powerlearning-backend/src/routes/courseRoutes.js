const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

router.get('/', courseController.getCourses);

router.post('/enroll', verifyToken, verifyRole(['alumno']), courseController.enrollCourse);
router.post('/unenroll', verifyToken, verifyRole(['alumno']), courseController.unenrollCourse);
router.get('/my-courses/:userId', verifyToken, courseController.getMyCourses);
router.post('/', verifyToken, verifyRole(['profesor', 'admin']), courseController.createCourse);
router.put('/:id', verifyToken, verifyRole(['profesor', 'admin']), courseController.updateCourse);
router.delete('/:id', verifyToken, verifyRole(['profesor', 'admin']), courseController.deleteCourse);
router.put('/:id/approve', verifyToken, verifyRole(['admin']), courseController.approveCourse);
router.put('/:id/reject', verifyToken, verifyRole(['admin']), courseController.rejectCourse);
router.put('/:id/suspend', verifyToken, verifyRole(['admin']), courseController.suspendCourse);

module.exports = router;