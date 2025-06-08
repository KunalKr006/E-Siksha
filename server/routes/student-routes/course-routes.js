const express = require("express");
const {
  getStudentViewCourseDetails,
  getAllStudentViewCourses,
  checkCoursePurchaseInfo,
  getRecommendedCourses
} = require("../../controllers/student-controller/course-controller");
const router = express.Router();

router.get("/get", getAllStudentViewCourses);
router.get("/get/details/:id", getStudentViewCourseDetails);
router.get('/course/:id', getStudentViewCourseDetails);

router.get("/purchase-info/:id/:studentId", checkCoursePurchaseInfo);
router.get("/recommendations/:courseId", getRecommendedCourses);

module.exports = router;
