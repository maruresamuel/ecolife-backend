const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.FILE_UPLOAD_PATH || './uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|pjpeg)$/i;
  
  const extname = allowedExtensions.test(file.originalname.toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';

  // Accept if extension is valid and MIME type is either a valid image type or octet-stream
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

module.exports = upload;