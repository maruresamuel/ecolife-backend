const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|pjpeg)$/i;
  
  const extname = allowedExtensions.test(file.originalname.toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';

  // Accept if extension is valid and MIME type is either a valid image type or octet-stream
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

module.exports = upload;
