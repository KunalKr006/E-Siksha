const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
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
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

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
    if (error.message === "Error uploading to cloudinary") {
      res.status(500).json({ 
        success: false, 
        message: "Error uploading to cloud storage. Please try again." 
      });
    } else if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ 
        success: false, 
        message: "File size too large. Maximum size is 50MB." 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Error uploading file. Please try again." 
      });
    }
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Asset Id is required",
      });
    }

    await deleteMediaFromCloudinary(id);

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully from cloudinary",
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

router.post("/bulk-upload", upload.array("files", 10), async (req, res) => {
  try {
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
