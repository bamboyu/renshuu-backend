// middleware/upload.js
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/aws"); // AWS S3 configuration

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    // generate unique file names
    key: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + file.originalname;
      cb(null, uniqueName);
    },
  }),
  // ensure only images and audio files are uploaded
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "application/octet-stream", // for ai generated files
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("File type not allowed"), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
