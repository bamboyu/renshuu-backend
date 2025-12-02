const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("File type not allowed"), false);
    }

    cb(null, true);
  },
});

module.exports = upload;
