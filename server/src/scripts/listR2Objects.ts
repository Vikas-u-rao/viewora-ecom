import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const accountId = process.env.R2_ACCOUNT_ID || "e2158ae0625a060589cba0ccebcd3fee";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "73fede634675f899d6412ddcaf59c06f";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "680700f9a92259d0188a5450a6a77f2d1e4730780024064320b531f65a8a5ac6";
const bucketName = process.env.R2_BUCKET_NAME || "viewora-assets";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function main() {
  console.log("Fetching list of all objects in Cloudflare R2 bucket...");
  const response: any = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
  const objects = response.Contents || [];
  console.log(`Total objects found: ${objects.length}`);
  
  const today = new Date().toISOString().split("T")[0];
  console.log("Today's date:", today);
  
  const todayObjects = objects.filter((o: any) => {
    const modDate = o.LastModified ? new Date(o.LastModified).toISOString().split("T")[0] : "";
    return modDate === today;
  });

  console.log(`Objects uploaded today (${today}):`, todayObjects.length);
  todayObjects.forEach((o: any) => {
    console.log(`- ${o.Key} (${o.Size} bytes, LastModified: ${o.LastModified})`);
  });
}

main().catch(console.error);
