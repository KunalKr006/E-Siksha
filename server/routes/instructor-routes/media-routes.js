const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Course = require('../../models/Course'); // Import Course model
const {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
} = require("../../helpers/cloudinary");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadsDir,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
});

// Add error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${upload.limits.fileSize / (1024 * 1024)}MB.`
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  next(err);
};

router.post("/upload", upload.single("file"), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    const { courseId, lectureId } = req.body;

    if (!courseId || !lectureId) {
      // Clean up the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });
      return res.status(400).json({
        success: false,
        message: "courseId and lectureId are required"
      });
    }

    console.log(`Attempting to upload file for course ${courseId}, lecture ${lectureId}`);
    console.log('File details:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const result = await uploadMediaToCloudinary(req.file.path);
    
    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temporary file:", err);
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    
    // Clean up the temporary file if it exists
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });
    }

    // Send appropriate error message
    if (error.message === "Invalid Cloudinary credentials") {
      res.status(500).json({ 
        success: false, 
        message: "Server configuration error. Please contact support." 
      });
    } else if (error.message === "Error uploading to cloudinary") {
      res.status(500).json({ 
        success: false, 
        message: "Error uploading to cloud storage. Please try again." 
      });
    } else if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ 
        success: false, 
        message: "File size too large. Maximum size is 500MB." 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Error uploading file. Please try again.",
        error: error.message // Include error message for debugging
      });
    }
  }
});

router.delete("/delete/:id", async (req, res) => {
  console.log(`Received delete request for public ID: ${req.params.id}`);
  try {
    const { id } = req.params;

    if (!id) {
      console.warn("Delete request missing public ID.");
      return res.status(400).json({
        success: false,
        message: "Asset Id is required",
      });
    }

    console.log(`Attempting to delete media with public ID: ${id} from Cloudinary.`);
    const result = await deleteMediaFromCloudinary(id);
    
    // If we get here, either the asset was deleted or it didn't exist
    // Both cases are considered successful since the end goal is achieved
    console.log(`Media deletion operation completed for public ID: ${id}. Result:`, result);

    res.status(200).json({
      success: true,
      message: "Asset successfully removed from cloudinary",
      data: { result }
    });
  } catch (e) {
    console.error("Error in /media/delete/:id endpoint:", e);
    
    // Provide more specific error messages based on the error
    let errorMessage = "Error deleting file";
    if (e.message === "No public ID provided") {
      errorMessage = "No asset ID provided for deletion";
    } else if (e.message === "Failed to delete asset from cloudinary") {
      errorMessage = "Failed to delete asset from cloud storage";
    }

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: e.message 
    });
  }
});

router.post("/bulk-upload", upload.array("files", 10), async (req, res) => {
  try {
    const { courseId, lectureIds } = req.body;

    const uploadPromises = req.files.map((fileItem) =>
      uploadMediaToCloudinary(fileItem.path)
    );

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (event) {
    console.log(event);

    res
      .status(500)
      .json({ success: false, message: "Error in bulk uploading files" });
  }
});

module.exports = router;

