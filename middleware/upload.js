const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpe?g|png|webp|gif)$/i;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|webp|gif|pjpeg)$/i;
  
  const extname = allowedExtensions.test(file.originalname.toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';

  // Accept if extension is valid and MIME type is either a valid image type or octet-stream
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to handle single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    uploadSingle(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({
          success: false,
          message: 'Error uploading file',
          error: err.message,
        });
      }
      next();
    });
  };
};

// Middleware to handle multiple file uploads
const uploadMultiple = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    const uploadMultiple = upload.array(fieldName, maxCount);
    uploadMultiple(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({
          success: false,
          message: 'Error uploading files',
          error: err.message,
        });
      }
      next();
    });
  };
};

// Middleware to handle any file type (for documents, etc.)
const uploadAny = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadAny,
};
