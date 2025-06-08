const express = require("express");
const router = express.Router();
const Course = require("../models/Course"); // Keep Course model if needed for other info
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import Google Generative AI

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Use GEMINI_API_KEY

// Removed: Function to list available models (for debugging)
// Removed: Call listModels when the server starts

// Basic endpoint to receive chatbot messages
router.post("/message", async (req, res) => {
  try {
    const { courseId, lectureId, message } = req.body; // Keep courseId/lectureId if needed for context
    console.log(`Received message for course ${courseId}, lecture ${lectureId}: ${message}`);

    // Removed: Fetch the lecture and its transcription

    // Use Gemini to generate a general response
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"}); // Changed model to gemini-2.0-flash

    const result = await model.generateContent(message); // Use user's message as prompt
    const aiResponse = result.response.text(); // Extract text response

    // Send the AI response
    res.status(200).json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error("Error in chatbot message endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Error processing message."
    });
  }
});

module.exports = router; 