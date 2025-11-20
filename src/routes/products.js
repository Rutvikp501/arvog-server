import express from "express";
import { uploadLocal } from "../config/s3.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  downloadProductCSV,
  downloadProductExcel,
  bulkUploadProducts,
  getBulkStatus,
} from "../controllers/product.Controller.js";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/", uploadLocal.single("productImage"), createProduct);
router.get("/", getAllProducts);
router.put("/:id", uploadLocal.single("image"), updateProduct);
router.delete("/:id", deleteProduct);
router.post("/bulk-upload", upload.single("file"),bulkUploadProducts );

router.get("/bulk-status/:jobId", getBulkStatus);

router.get("/report/csv", downloadProductCSV);
router.get("/report/xlsx", downloadProductExcel);
export default router;
