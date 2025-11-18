import express from "express";
import { uploadLocal } from "../config/s3.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  startBulkUpload,
  getBulkStatus,
} from "../controllers/product.Controller.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post("/", uploadLocal.single("image"), createProduct);
router.get("/", getAllProducts);
router.put("/:id", uploadLocal.single("image"), updateProduct);
router.delete("/:id", deleteProduct);
router.post("/bulk-upload", upload.single("file"), startBulkUpload);
router.get("/bulk-status/:jobId", getBulkStatus);
export default router;
