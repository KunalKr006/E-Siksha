const express = require("express");
const {
  addNewCourse,
  getAllCourses,
  getCourseDetailsByID,
  updateCourseByID,
} = require("../../controllers/instructor-controller/course-controller");
const router = express.Router();
const authMiddleware = require("../../middleware/auth-middleware");

router.post("/add", addNewCourse);
router.get("/get", authMiddleware, getAllCourses);
router.get("/get/details/:id", getCourseDetailsByID);
router.put("/update/:id", updateCourseByID);

module.exports = router;
