import multer from 'multer';

// Use memory storage to stream directly to Azure Blob Storage without saving to disk
const storage = multer.memoryStorage();

/**
 * Filter: Allows only PDF, JPG, JPEG, and PNG files.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type: Only PDF, JPG, JPEG, and PNG files are allowed');
    error.statusCode = 400;
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB in bytes
  }
});
