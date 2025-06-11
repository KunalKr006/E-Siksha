const express = require("express");
const {
  addNewCourse,
  getAllCourses,
  getCourseDetailsByID,
  updateCourseByID,
} = require("../../controllers/instructor-controller/course-controller");
const { reindexAllCourses } = require("../../services/search-service");
const router = express.Router();
const authMiddleware = require("../../middleware/auth-middleware");

// Add auth middleware to protect instructor routes
router.use(authMiddleware);

router.post("/add", addNewCourse);
router.get("/get", getAllCourses);
router.get("/get/details/:id", getCourseDetailsByID);
router.put("/update/:id", updateCourseByID);

// Add route to re-index all courses
router.post("/reindex", async (req, res) => {
  try {
    const success = await reindexAllCourses();
    if (success) {
      res.status(200).json({
        success: true,
        message: "All courses re-indexed successfully"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to re-index courses"
      });
    }
  } catch (error) {
    console.error("Error in re-index route:", error);
    res.status(500).json({
      success: false,
      message: "Error re-indexing courses"
    });
  }
});

module.exports = router;
