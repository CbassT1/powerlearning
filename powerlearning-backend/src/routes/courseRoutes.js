const express = require('express');
const router = express.Router();
const { getCourses, createCourse, approveCourse, rejectCourse, deleteCourse, enrollInCourse, getMyCourses, suspendCourse, updateCourse, unenrollFromCourse } = require('../controllers/courseController');

router.get('/', getCourses);
router.post('/', createCourse);
router.put('/:id/approve', approveCourse);
router.post('/enroll', enrollInCourse);
router.put('/:id/reject', rejectCourse);
router.get('/my-courses/:userId', getMyCourses);
router.delete('/:id', deleteCourse);
router.put('/:id/suspend', suspendCourse);
router.put('/:id', updateCourse);
router.post('/unenroll', unenrollFromCourse);

module.exports = router;