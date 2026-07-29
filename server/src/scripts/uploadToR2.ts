import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const accountId = process.env.R2_ACCOUNT_ID || "e2158ae0625a060589cba0ccebcd3fee";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "73fede634675f899d6412ddcaf59c06f";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "680700f9a92259d0188a5450a6a77f2d1e4730780024064320b531f65a8a5ac6";
const bucketName = process.env.R2_BUCKET_NAME || "viewora-assets";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const imagesDir = path.resolve(__dirname, "../../../images");

async function getExistingKeys(): Promise<Set<string>> {
  console.log("Fetching list of existing objects in R2 bucket...");
  const keys = new Set<string>();
  let continuationToken: string | undefined = undefined;

  do {
    const response: any = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key) {
          keys.add(item.Key);
        }
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  console.log(`Found ${keys.size} existing keys in R2.`);
  return keys;
}

async function uploadImages() {
  console.log(`Starting optimized bulk upload from: ${imagesDir}`);
  if (!fs.existsSync(imagesDir)) {
    console.error(`Images directory does not exist: ${imagesDir}`);
    process.exit(1);
  }

  const existingKeys = await getExistingKeys();
  const files = fs.readdirSync(imagesDir);
  console.log(`Found ${files.length} files to process.`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  // Prepare list of all upload tasks
  const uploadTasks: { filePath: string; key: string; contentType: string }[] = [];

  for (const filename of files) {
    const filePath = path.join(imagesDir, filename);
    if (fs.statSync(filePath).isDirectory()) continue;
    if (!/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename)) continue;

    const keyWithSku = `uploads/products/${filename}`;
    const cleanName = filename.replace(/^[A-Z0-9;,_-]+?_/, "");
    const cleanKey = `uploads/products/${cleanName}`;

    const extMatch = cleanName.match(/\.(jpg|jpeg|png|webp)$/i);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const nameNoExt = cleanName.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    
    const zeroKey = nameNoExt.includes("_") 
      ? `uploads/products/${nameNoExt}${ext}`
      : `uploads/products/${nameNoExt}_0${ext}`;

    const contentType = filename.endsWith(".png")
      ? "image/png"
      : filename.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

    const keysToUpload = Array.from(new Set([keyWithSku, cleanKey, zeroKey]));

    for (const key of keysToUpload) {
      if (existingKeys.has(key)) {
        skipped++;
      } else {
        uploadTasks.push({ filePath, key, contentType });
      }
    }
  }

  console.log(`Skipped: ${skipped} keys (already exist). Need to upload: ${uploadTasks.length} keys.`);

  // Upload in parallel using a promise pool
  const CONCURRENCY = 80;
  let activeIndex = 0;

  async function worker() {
    while (activeIndex < uploadTasks.length) {
      const taskIndex = activeIndex++;
      if (taskIndex >= uploadTasks.length) break;

      const { filePath, key, contentType } = uploadTasks[taskIndex];

      try {
        const fileStream = fs.readFileSync(filePath);
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
          })
        );
        uploaded++;
        if (uploaded % 100 === 0) {
          console.log(`[${uploaded}] Successfully uploaded: ${key}`);
        }
      } catch (err: any) {
        errors++;
        console.error(`Failed to upload ${key}:`, err.message);
      }
    }
  }

  // Start workers
  const workers = Array(CONCURRENCY).fill(null).map(worker);
  await Promise.all(workers);

  console.log(`\n🎉 Optimized Upload Complete!`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

uploadImages().catch(console.error);
