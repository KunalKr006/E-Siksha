const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`);
  }
};

// Configure Cloudinary
try {
  validateCloudinaryConfig();
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (error) {
  console.error("Cloudinary configuration error:", error.message);
  process.exit(1); // Exit if Cloudinary is not properly configured
}

const uploadMediaToCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error("No file path provided");
    }

    // Check file size before uploading
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    if (fileSizeInMB > 100) {
      throw new Error(`File size (${Math.round(fileSizeInMB)}MB) exceeds Cloudinary's 100MB limit. Please compress your video or split it into smaller segments.`);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      chunk_size: 6000000, // 6MB chunks for better upload performance
      timeout: 120000, // 120 second timeout for larger files
      eager: [
        { format: "mp4", quality: "auto" } // Automatically optimize video quality
      ],
      eager_async: true
    });

    if (!result || !result.secure_url) {
      throw new Error("Invalid response from Cloudinary");
    }

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    
    if (error.http_code === 401) {
      throw new Error("Invalid Cloudinary credentials");
    } else if (error.http_code === 413) {
      throw new Error("File size exceeds Cloudinary's 100MB limit. Please compress your video or split it into smaller segments.");
    } else if (error.http_code === 429) {
      throw new Error("Cloudinary rate limit exceeded. Please try again in a few minutes.");
    } else {
      throw new Error(`Error uploading to Cloudinary: ${error.message}`);
    }
  }
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    console.log(`deleteMediaFromCloudinary called with publicId: ${publicId}`);
    if (!publicId) {
      console.warn("deleteMediaFromCloudinary: No public ID provided");
      throw new Error("No public ID provided");
    }

    console.log(`Calling Cloudinary uploader.destroy for publicId: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary uploader.destroy result for ${publicId}:`, result);
    
    // If the asset doesn't exist (result.result === 'not found'), consider it a success
    // since the end goal is that the asset should not exist
    if (result.result === 'not found') {
      console.log(`Asset ${publicId} not found in Cloudinary - treating as successful deletion`);
      return { result: 'ok' }; // Return success to maintain consistent behavior
    }
    
    if (result.result !== "ok") {
      console.error(`Cloudinary deletion failed for publicId ${publicId}:`, result);
      throw new Error("Failed to delete asset from cloudinary");
    }
    console.log(`Cloudinary deletion successful for publicId: ${publicId}`);
    return result;

  } catch (error) {
    // If the error is about the asset not existing, treat it as a success
    if (error.message && error.message.includes('not found')) {
      console.log(`Asset ${publicId} not found in Cloudinary - treating as successful deletion`);
      return { result: 'ok' };
    }
    console.error("Error in deleteMediaFromCloudinary:", error);
    throw new Error("Failed to delete asset from cloudinary");
  }
};

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary };
