const mongoose = require("mongoose");

const NotesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true // Add index for faster queries
  },
  courseId: {
    type: String,
    required: true,
    index: true
  },
  lectureId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Compound index for faster queries when fetching notes for a specific lecture
NotesSchema.index({ userId: 1, courseId: 1, lectureId: 1 });

module.exports = mongoose.model("Notes", NotesSchema); 