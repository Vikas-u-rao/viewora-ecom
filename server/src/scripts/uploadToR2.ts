import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const accountId = "e2158ae0625a060589cba0ccebcd3fee";
const accessKeyId = "73fede634675f899d6412ddcaf59c06f";
const secretAccessKey = "680700f9a92259d0188a5450a6a77f2d1e4730780024064320b531f65a8a5ac6";
const bucketName = "viewora-assets";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const imagesDir = path.resolve(__dirname, "../../../images");

async function uploadImages() {
  console.log(`Starting bulk upload from: ${imagesDir}`);
  if (!fs.existsSync(imagesDir)) {
    console.error(`Images directory does not exist: ${imagesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(imagesDir);
  console.log(`Found ${files.length} files to process.`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(imagesDir, filename);

    // Skip directories or non-image files
    if (fs.statSync(filePath).isDirectory()) continue;
    if (!/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename)) continue;

    // R2 Object Keys to generate for 100% DB compatibility:
    // 1. uploads/products/SGGUC..._gucci-sunglass-gg1793s-004.jpg
    // 2. uploads/products/gucci-sunglass-gg1793s-004.jpg
    // 3. uploads/products/gucci-sunglass-gg1793s-004_0.jpg
    const keyWithSku = `uploads/products/${filename}`;
    const cleanName = filename.replace(/^[A-Z0-9;,_-]+?_/, "");
    const cleanKey = `uploads/products/${cleanName}`;

    const extMatch = cleanName.match(/\.(jpg|jpeg|png|webp)$/i);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const nameNoExt = cleanName.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    
    // Add _0 suffix if not already containing _
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
      try {
        // Check if file already exists in R2
        try {
          await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
          skipped++;
          continue;
        } catch (err: any) {
          // Object doesn't exist, proceed with upload
        }

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
        if (uploaded % 50 === 0) console.log(`[${uploaded}] Uploaded: ${key}`);
      } catch (err: any) {
        errors++;
        console.error(`Failed to upload ${key}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Upload Complete!`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

uploadImages();
