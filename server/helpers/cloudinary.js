const cloudinary = require("cloudinary").v2;

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

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      chunk_size: 6000000, // 6MB chunks for better upload performance
      timeout: 60000, // 60 second timeout
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
      throw new Error("File too large for Cloudinary");
    } else if (error.http_code === 429) {
      throw new Error("Cloudinary rate limit exceeded");
    } else {
      throw new Error("Error uploading to cloudinary");
    }
  }
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("No public ID provided");
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== "ok") {
      throw new Error("Failed to delete asset from cloudinary");
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete asset from cloudinary");
  }
};

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary };
