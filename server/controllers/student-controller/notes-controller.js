const Notes = require("../../models/Notes");

// Get notes for a specific lecture
const getNotes = async (req, res) => {
  try {
    const { userId, courseId, lectureId } = req.query;

    if (!userId || !courseId || !lectureId) {
      return res.status(400).json({
        success: false,
        message: "userId, courseId, and lectureId are required"
      });
    }

    const notes = await Notes.findOne({ userId, courseId, lectureId });

    res.status(200).json({
      success: true,
      data: notes || { content: "" } // Return empty content if no notes exist
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notes"
    });
  }
};

// Save or update notes for a lecture
const saveNotes = async (req, res) => {
  try {
    const { userId, courseId, lectureId, content } = req.body;

    if (!userId || !courseId || !lectureId || content === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, courseId, lectureId, and content are required"
      });
    }

    // Use findOneAndUpdate with upsert to create or update notes
    const notes = await Notes.findOneAndUpdate(
      { userId, courseId, lectureId },
      { 
        content,
        lastUpdated: new Date()
      },
      { 
        new: true, // Return the updated document
        upsert: true // Create if doesn't exist
      }
    );

    res.status(200).json({
      success: true,
      data: notes,
      message: "Notes saved successfully"
    });
  } catch (error) {
    console.error("Error saving notes:", error);
    res.status(500).json({
      success: false,
      message: "Error saving notes"
    });
  }
};

// Delete notes for a lecture
const deleteNotes = async (req, res) => {
  try {
    const { userId, courseId, lectureId } = req.query;

    if (!userId || !courseId || !lectureId) {
      return res.status(400).json({
        success: false,
        message: "userId, courseId, and lectureId are required"
      });
    }

    await Notes.findOneAndDelete({ userId, courseId, lectureId });

    res.status(200).json({
      success: true,
      message: "Notes deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting notes:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notes"
    });
  }
};

// Get all notes for a course
const getCourseNotes = async (req, res) => {
  try {
    const { userId, courseId } = req.query;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "userId and courseId are required"
      });
    }

    const notes = await Notes.find({ userId, courseId })
      .sort({ lastUpdated: -1 }); // Sort by last updated, newest first

    res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error("Error fetching course notes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching course notes"
    });
  }
};

module.exports = {
  getNotes,
  saveNotes,
  deleteNotes,
  getCourseNotes
}; 