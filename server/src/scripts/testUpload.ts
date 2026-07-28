import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

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

async function main() {
  console.log("Testing connection to R2...");
  try {
    const list: any = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 5 }));
    console.log("Success! Objects in bucket:", list.Contents?.map((c: any) => c.Key) || []);
  } catch (err: any) {
    console.error("Failed to list objects in R2:", err.message, err.stack);
  }
}

main();
