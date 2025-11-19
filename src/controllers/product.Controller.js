import Product from '../models/product.js';
import Category from '../models/category.js';
import { s3Upload, s3Delete, safeUnlink } from '../config/s3.js';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import { format } from '@fast-csv/format';
const jobStatus = {};

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FOLDER = 'ProductImages';

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, price, categoryId } = req.body;

    const category = await Category.findByPk(categoryId);

    if (!category) {
      safeUnlink(req.file?.path);
      return res.status(400).json({ message: 'Invalid category' });
    }

    let image = null;

    if (req.file) {
      const uploaded = await s3Upload(req.file, FOLDER);
      console.log(uploaded);

      image = { publicId: uploaded.key, url: uploaded.url };
      safeUnlink(req.file.path); // delete local copy
    }

    const product = await Product.create({
      name,
      price,
      categoryId,
      imageUrl: image?.url || null,
      imageKey: image?.publicId || null,
    });

    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: { model: Category, attributes: ['name'] },
      attributes: ['id', 'name', 'price', 'imageUrl', 'imageKey', 'categoryId'], // Add this line
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: products,
    });
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
      return res.status(404).json({ message: 'Product not found' });
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

    res.json({ message: 'Product updated', product });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ message: err.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const key = product.image?.publicId;
    if (key) await s3Delete(key).catch(() => null);

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startBulkUpload = async (req, res) => {
  const filePath = req.file.path;
  const jobId = Date.now().toString();

  jobStatus[jobId] = { status: 'processing', progress: 0 };

  const worker = new Worker(path.resolve(__dirname, '../services/bulkUploadService.js'), {
    workerData: { filePath, jobId },
  });

  worker.on('message', (data) => {
    jobStatus[jobId] = data;
  });

  worker.on('error', () => {
    jobStatus[jobId] = { status: 'failed' };
  });

  worker.on('exit', () => {
    if (jobStatus[jobId].status !== 'failed') {
      jobStatus[jobId] = { status: 'completed', progress: 100 };
    }
  });

  res.status(202).json({
    message: 'Bulk upload started',
    jobId,
    checkStatus: `/api/bulk-status/${jobId}`,
  });
};

export const getBulkStatus = (req, res) => {
  res.json(jobStatus[req.params.jobId] || { status: 'not-found' });
};

export const downloadProductCSV = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: { model: Category, attributes: ['name'] },
      order: [['createdAt', 'DESC']],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    products.forEach((p) => {
      csvStream.write({
        ID: p.id,
        imageUrl: p.imageUrl,
        Name: p.name,
        Price: p.price,
        Category: p.Category?.name || '',
        CreatedAt: p.createdAt.toISOString(),
      });
    });

    csvStream.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate CSV report', error: err.message });
  }
};

// Download XLSX Report
export const downloadProductExcel = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: { model: Category, attributes: ['name'] },
      order: [['createdAt', 'DESC']],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'imageUrl', key: 'imageUrl', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 25 },
    ];

    // Add data
    products.forEach((p) => {
      worksheet.addRow({
        id: p.id,
        imageUrl: p.imageUrl,
        name: p.name,
        price: p.price,
        category: p.Category?.name || '',
        createdAt: p.createdAt.toISOString(),
      });
    });

    // Style header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDDDDD' },
      };
    });

    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate Excel report', error: err.message });
  }
};

export const bulkUploadProducts = async (req, res) => {
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const failed = [];
    const inserted = [];

    for (const row of rows) {
      try {
        const { name, price, categoryId, imageUrl } = row;

        // Validate fields
        if (!name || !price || !categoryId) {
          failed.push({ row, reason: 'Missing required fields' });
          continue;
        }

        const category = await Category.findByPk(categoryId);
        if (!category) {
          failed.push({ row, reason: 'Invalid categoryId' });
          continue;
        }

        let uploadedImage = null;

        // If imageUrl exists in excel, upload it to S3
        if (imageUrl && typeof imageUrl === 'string') {
          uploadedImage = await s3Upload(
            { path: imageUrl }, // custom processing logic
            'products'
          );
        }

        const product = await Product.create({
          name,
          price,
          categoryId,
          imageUrl: uploadedImage?.url || imageUrl || null,
          imageKey: uploadedImage?.key || null,
        });

        inserted.push(product);
      } catch (err) {
        failed.push({ row, reason: err.message });
      }
    }

    res.status(200).json({
      message: 'Bulk upload completed',
      inserted: inserted.length,
      failed: failed.length,
      failedRows: failed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Bulk upload failed', error: err.message });
  }
};
