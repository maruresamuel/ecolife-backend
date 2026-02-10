const cloudinary = require('cloudinary').v2;
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Promisify Cloudinary methods
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    // Default options
    const uploadOptions = {
      folder: 'ecolife',
      resource_type: 'auto', // Automatically detect the resource type
      ...options,
    };

    // Upload the file
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Error uploading file to Cloudinary');
  }
};

const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const deleteOptions = {
      resource_type: 'image', // Default to image, can be overridden
      invalidate: true, // Invalidate CDN cache
      ...options,
    };

    const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
    
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
    
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Error deleting file from Cloudinary');
  }
};

const uploadFromBuffer = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'ecolife/buffers',
      resource_type: 'auto', // Automatically detect the resource type
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          return reject(new Error('Error uploading file to Cloudinary'));
        }
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at,
        });
      }
    );

    // Create a buffer stream and pipe to Cloudinary
    const bufferStream = require('stream').Readable.from(buffer);
    bufferStream.pipe(uploadStream);
  });
};

const getCloudinaryUrl = (publicId, options = {}) => {
  const defaultOptions = {
    secure: true,
    quality: 'auto',
    fetch_format: 'auto',
  };

  return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

const deleteMultipleFromCloudinary = async (publicIds, options = {}) => {
  try {
    const deleteOptions = {
      resource_type: 'image', // Default to image, can be overridden
      invalidate: true, // Invalidate CDN cache
      ...options,
    };

    // Split into chunks of 100 (Cloudinary API limit)
    const chunkSize = 100;
    const chunks = [];
    
    for (let i = 0; i < publicIds.length; i += chunkSize) {
      chunks.push(publicIds.slice(i, i + chunkSize));
    }

    // Delete in chunks
    const results = [];
    for (const chunk of chunks) {
      const result = await cloudinary.api.delete_resources(chunk, deleteOptions);
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Cloudinary batch delete error:', error);
    throw new Error('Error deleting files from Cloudinary');
  }
};

const getResourceInfo = async (publicId, options = {}) => {
  try {
    const infoOptions = {
      resource_type: 'image', // Default to image, can be overridden
      ...options,
    };

    const result = await cloudinary.api.resource(publicId, infoOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary get resource error:', error);
    if (error.http_code === 404) {
      return null; // Resource not found
    }
    throw new Error('Error getting resource info from Cloudinary');
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadFromBuffer,
  getCloudinaryUrl,
  deleteMultipleFromCloudinary,
  getResourceInfo,
};
