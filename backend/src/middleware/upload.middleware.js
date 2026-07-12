import multer from "multer";
import { MAX_FILE_SIZE_BYTES } from "../config/constants.js";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const isCsv =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.originalname.toLowerCase().endsWith(".csv");
  if (!isCsv) {
    return cb(new Error("Only .csv files are supported"));
  }
  cb(null, true);
}

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single("file");
