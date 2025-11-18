// src/workers/bulkProduct.worker.js
import { workerData, parentPort } from "worker_threads";
import parseCSV from "../helpers/csvParser.js";
import Product from "../models/product.js";

(async () => {
  const { filePath, jobId } = workerData;
  const records = await parseCSV(filePath);

  const batchSize = 500;
  let processed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    await Product.bulkCreate(chunk, { ignoreDuplicates: true });

    processed += chunk.length;
    parentPort.postMessage({
      jobId,
      status: "processing",
      progress: Math.round((processed / records.length) * 100),
    });
  }

  parentPort.postMessage({ jobId, status: "completed", progress: 100 });
})();
