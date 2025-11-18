import Product from "../models/product.js";
import Category from "../models/category.js";
import { s3Upload, s3Delete, safeUnlink } from "../config/s3.js";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const jobStatus = {};

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FOLDER = "ProductImages";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, price, categoryId } = req.body;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      safeUnlink(req.file?.path);
      return res.status(400).json({ message: "Invalid category" });
    }

    let image = null;

    if (req.file) {
      const uploaded = await s3Upload(req.file, FOLDER);
      image = { publicId: uploaded.key, url: uploaded.url };
      safeUnlink(req.file.path); // delete local copy
    }

    const product = await Product.create({
      name,
      price,
      categoryId,
      image,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: { model: Category, attributes: ["name", "uniqueId"] },
      order: [["createdAt", "DESC"]],
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      safeUnlink(req.file?.path);
      return res.status(404).json({ message: "Product not found" });
    }

    let newImage = product.image;

    if (req.file) {
      const uploaded = await s3Upload(req.file, FOLDER);

      // delete old from S3 if exists
      const oldKey = product?.image?.publicId;
      if (oldKey) await s3Delete(oldKey).catch(() => null);

      newImage = { publicId: uploaded.key, url: uploaded.url };
      safeUnlink(req.file.path);
    }

    await product.update({
      ...req.body,
      image: newImage,
    });

    res.json({ message: "Product updated", product });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ message: err.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const key = product.image?.publicId;
    if (key) await s3Delete(key).catch(() => null);

    await product.destroy();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const startBulkUpload = async (req, res) => {
  const filePath = req.file.path;
  const jobId = Date.now().toString();

  jobStatus[jobId] = { status: "processing", progress: 0 };

  const worker = new Worker(path.resolve(__dirname, "../workers/bulkProduct.worker.js"), {
    workerData: { filePath, jobId },
  });

  worker.on("message", (data) => {
    jobStatus[jobId] = data;
  });

  worker.on("error", () => {
    jobStatus[jobId] = { status: "failed" };
  });

  worker.on("exit", () => {
    if (jobStatus[jobId].status !== "failed") {
      jobStatus[jobId] = { status: "completed", progress: 100 };
    }
  });

  res.status(202).json({
    message: "Bulk upload started",
    jobId,
    checkStatus: `/api/bulk-status/${jobId}`,
  });
};

export const getBulkStatus = (req, res) => {
  res.json(jobStatus[req.params.jobId] || { status: "not-found" });
};