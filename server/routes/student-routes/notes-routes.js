const express = require("express");
const router = express.Router();
const {
  getNotes,
  saveNotes,
  deleteNotes,
  getCourseNotes
} = require("../../controllers/student-controller/notes-controller");
const authMiddleware = require("../../middleware/auth-middleware");

// All routes require authentication
router.use(authMiddleware);

// Get notes for a specific lecture
router.get("/lecture", getNotes);

// Save or update notes for a lecture
router.post("/save", saveNotes);

// Delete notes for a lecture
router.delete("/delete", deleteNotes);

// Get all notes for a course
router.get("/course", getCourseNotes);

module.exports = router; 