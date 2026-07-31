import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "viewora-assets";

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing required R2 credentials in environment variables.");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function main() {
  console.log("Fetching today's uploaded objects from Cloudflare R2...");
  const response: any = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
  const objects = response.Contents || [];
  
  const today = new Date().toISOString().split("T")[0];
  const todayObjects = objects.filter((o: any) => {
    const modDate = o.LastModified ? new Date(o.LastModified).toISOString().split("T")[0] : "";
    return modDate === today;
  });

  console.log(`Found ${todayObjects.length} test objects uploaded today (${today}). Deleting...`);

  if (todayObjects.length === 0) {
    console.log("No test objects found to delete.");
    return;
  }

  const objectsToDelete = todayObjects.map((o: any) => ({ Key: o.Key }));

  const deleteResult = await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: objectsToDelete },
    })
  );

  console.log(`Successfully deleted ${deleteResult.Deleted?.length || 0} test objects from Cloudflare R2!`);
}

main().catch(console.error);
