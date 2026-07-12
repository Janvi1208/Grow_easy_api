import { Router } from "express";
import { uploadCsv } from "../middleware/upload.middleware.js";
import { importCsv, healthCheck } from "../controllers/import.controller.js";

const router = Router();

router.get("/health", healthCheck);
router.post("/csv/import", uploadCsv, importCsv);

export default router;
