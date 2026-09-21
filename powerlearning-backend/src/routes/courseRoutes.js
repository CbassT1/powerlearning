const express = require('express');
const router = express.Router();
const { getCourses, enrollCourse, createCourse, approveCourse, deleteCourse } = require('../controllers/courseController');

router.get('/', getCourses);
router.post('/enroll', enrollCourse);
router.post('/', createCourse);
router.put('/:id/approve', approveCourse);
router.delete('/:id', deleteCourse);

module.exports = router;