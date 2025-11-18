// config/s3.js
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import fs from "fs";

const bucketName = process.env.AWS_BUCKET_NAME;

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Local temp upload (multer) – this parses multipart & populates req.body + req.file
export const uploadLocal = multer({
  dest: "tmp/", // temp folder
});
export const safeUnlink = (p) => {
  if (!p) return;
  fs.unlink(p, () => {});
};
// Upload the temp file to S3 (call this AFTER validation)
export const s3Upload = async (file, folder) => {
  const key = `${folder}/${Date.now()}_${file.originalname}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fs.readFileSync(file.path),
    ContentType: file.mimetype,
  });
  await s3.send(command);

  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
};
export const s3UploadMultiple = async (files, folder) => {
  const uploadPromises = files.map(async (file) => {
    const key = `${folder}/${Date.now()}_${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fs.readFileSync(file.path),
      ContentType: file.mimetype,
    });
    await s3.send(command);

    // Clean up local file after upload
    fs.unlinkSync(file.path);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { key, url };
  });

  return Promise.all(uploadPromises);
};

// export const s3Upload = async (key, body, contentType) => {
//   const command = new PutObjectCommand({
//     Bucket: bucketName,
//     Key: key,
//     Body: body,
//     ContentType: contentType,
//   });
//   await s3.send(command);
//   return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
// };

export const s3GetFile = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
};

export const s3Delete = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await s3.send(command);
  return true;
};

export const s3DeleteMany = async (keys = []) => {
  if (keys.length === 0) return;
  const command = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: { Objects: keys.map((key) => ({ Key: key })) },
  });
  await s3.send(command);
  return true;
};

export const s3List = async (prefix) => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  const response = await s3.send(command);
  return response.Contents || [];
};
