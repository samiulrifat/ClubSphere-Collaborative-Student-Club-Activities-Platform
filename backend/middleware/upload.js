const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Configure multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Preserve original extension
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for allowed mime types (optional)
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
});

module.exports = upload;
