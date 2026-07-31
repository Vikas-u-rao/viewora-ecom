/**
 * sync-missing-images-to-r2.ts
 *
 * Finds product images that 404 on cdn.viewora.in (the CDN the site loads),
 * downloads the originals from the Shopify CDN (or R2 dev domain), and
 * re-uploads them into the Cloudflare R2 bucket so the site stops showing
 * broken images. No client-side fallback is added — this fixes the root cause.
 *
 * URL transform mirrors client/src/lib/productImage.ts exactly:
 *   https://cdn.shopify.com/s/files/1/0694/2051/5411/files/<file> -> https://cdn.viewora.in/uploads/products/<file>
 *   pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev                  -> cdn.viewora.in
 *
 * Usage (from repo root):
 *   npx ts-node server/scripts/sync-missing-images-to-r2.ts            # verify + download + upload + re-verify
 *   npx ts-node server/scripts/sync-missing-images-to-r2.ts --check-only  # only re-scan and regenerate report
 *
 * Requires R2 credentials in server/.env:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME (optional), R2_CDN_URL (optional)
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_BASE = "https://viewora.in/api/v1";
const SHOPIFY_PREFIX = "https://cdn.shopify.com/s/files/1/0694/2051/5411/files/";
const R2_DEV_DOMAIN = "pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev";
// The client (client/src/lib/productImage.ts) always serves via cdn.viewora.in in production;
// server/.env may still hold the legacy pub-...r2.dev value, so never trust R2_CDN_URL verbatim.
const CDN_URL = (
  process.env.R2_CDN_URL?.includes("cdn.viewora.in") ? process.env.R2_CDN_URL : "https://cdn.viewora.in"
).replace(/\/+$/, "");
const REPORT_PATH = path.resolve(__dirname, "../../broken-images-report.csv");
const CHECK_CONCURRENCY = 6;
const SYNC_CONCURRENCY = 4;
const CHECK_TIMEOUT_MS = 20000;
const DOWNLOAD_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const UA = "Mozilla/5.0 (Viewora CDN sync)";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "viewora-assets";

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) in server/.env");
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const onlyCheck = process.argv.includes("--check-only");

function toDisplayUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith(SHOPIFY_PREFIX)) {
    return u.replace(SHOPIFY_PREFIX, `${CDN_URL}/uploads/products/`);
  }
  if (u.includes(R2_DEV_DOMAIN)) {
    return u.replace(R2_DEV_DOMAIN, "cdn.viewora.in");
  }
  return u;
}

function r2KeyFor(displayUrl: string): string | null {
  try {
    const parsed = new URL(displayUrl);
    if (parsed.hostname !== "cdn.viewora.in" || !parsed.pathname.startsWith("/uploads/products/")) {
      return null;
    }
    return decodeURIComponent(parsed.pathname).slice(1);
  } catch {
    return null;
  }
}

function extensionOf(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const ext = path.extname(clean).toLowerCase();
  return ext || ".jpg";
}

function contentTypeFor(ext: string, fallback: string | undefined): string {
  if (fallback && fallback.startsWith("image/")) return fallback;
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
  };
  return map[ext] || "image/jpeg";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function head(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(CHECK_TIMEOUT_MS), headers: { "User-Agent": UA } });
    return res.status;
  } catch {
    return 0;
  }
}

async function download(url: string): Promise<{ buffer: Buffer; contentType: string | undefined } | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS), headers: { "User-Agent": UA } });
      if (res.status !== 200) {
        if (attempt === MAX_RETRIES) return null;
        await sleep(500 * attempt);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) return null;
      return { buffer: buf, contentType: res.headers.get("content-type") || undefined };
    } catch {
      if (attempt === MAX_RETRIES) return null;
      await sleep(500 * attempt);
    }
  }
  return null;
}

async function uploadToR2(key: string, data: Buffer, contentType: string): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await s3.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: data, ContentType: contentType }));
      return true;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error(`  upload failed for ${key}: ${(err as Error).message}`);
        return false;
      }
      await sleep(800 * attempt);
    }
  }
  return false;
}

async function verifyOnCdn(displayUrl: string, attempts = 4): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if ((await head(displayUrl)) === 200) return true;
    await sleep(1000);
  }
  return false;
}

async function fetchAllProducts(): Promise<any[]> {
  const products: any[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const res = await fetch(`${API_BASE}/products?page=${page}&limit=${perPage}&_ts=${Date.now()}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`GET ${API_BASE}/products failed: ${res.status}`);
    const body = (await res.json()) as { products?: any[]; total?: number };
    products.push(...(body.products || []));
    if (!body.total || products.length >= body.total) break;
    page++;
  }
  return products;
}

async function runBatch<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
}

async function main() {
  console.log(`Fetching product catalog from ${API_BASE} ...`);
  const products = await fetchAllProducts();
  console.log(`Loaded ${products.length} products`);

  const urlMap = new Map<string, { productId: string; productName: string; brand: string }>();
  for (const p of products) {
    const all: string[] = [...(p.defaultImageUrls || [])];
    for (const v of p.variants || []) all.push(...(v.imageUrls || []));
    for (const u of all) {
      if (u && u.startsWith("http") && !urlMap.has(u)) {
        urlMap.set(u, { productId: p.id, productName: p.name, brand: p.brand || "" });
      }
    }
  }
  const uniqueUrls = [...urlMap.keys()];
  console.log(`Unique image URLs to verify: ${uniqueUrls.length}\n`);

  const broken: { url: string; displayUrl: string; meta: { productId: string; productName: string; brand: string } }[] = [];
  let checked = 0;
  await runBatch(uniqueUrls, CHECK_CONCURRENCY, async (u) => {
    const display = toDisplayUrl(u);
    const status = await head(display);
    if (status !== 200) {
      broken.push({ url: u, displayUrl: display, meta: urlMap.get(u)! });
      console.log(`BROKEN  ${display} (${status})`);
    }
    checked++;
    if (checked % 200 === 0) console.log(`checked ${checked}/${uniqueUrls.length}`);
  });
  console.log(`\nScan complete: ${uniqueUrls.length - broken.length} OK, ${broken.length} broken`);

  if (broken.length === 0) {
    fs.writeFileSync(REPORT_PATH, "product_id,product_name,brand,status,url\n");
    console.log("Nothing to fix. Report written to broken-images-report.csv");
    return;
  }

  let synced = 0;
  let failed: typeof broken = [];

  if (onlyCheck) {
    console.log("--check-only: skipping download/upload");
    failed = broken;
  } else {
    console.log(`\nSyncing ${broken.length} missing images from Shopify CDN to R2 ...`);
    await runBatch(broken, SYNC_CONCURRENCY, async (b) => {
      const key = r2KeyFor(b.displayUrl);
      if (!key) {
        console.log(`SKIP    ${b.displayUrl} (cannot map to R2 key, source not Shopify)`);
        failed.push(b);
        return;
      }
      const dl = await download(b.url);
      if (!dl) {
        console.log(`FAIL-DL ${b.displayUrl} (source download failed)`);
        failed.push(b);
        return;
      }
      const contentType = contentTypeFor(extensionOf(b.displayUrl), dl.contentType);
      if (!(await uploadToR2(key, dl.buffer, contentType))) {
        failed.push(b);
        return;
      }
      if (await verifyOnCdn(b.displayUrl)) {
        synced++;
        console.log(`SYNCED  ${b.displayUrl}`);
      } else {
        console.log(`UNVERIF ${b.displayUrl} (uploaded but CDN not serving yet)`);
        failed.push(b);
      }
    });
  }

  const stillBroken = await (async () => {
    if (failed.length === 0) return [];
    const out: typeof broken = [];
    let i = 0;
    await runBatch(failed, CHECK_CONCURRENCY, async (b) => {
      if ((await head(b.displayUrl)) !== 200) out.push(b);
      i++;
    });
    return out;
  })();

  const csvHeader = "product_id,product_name,brand,status,url\n";
  const csvRows = stillBroken.map(
    (b) => `"${b.meta.productId}","${b.meta.productName.replace(/"/g, '""')}","${b.meta.brand}","404","${b.displayUrl}"`
  );
  fs.writeFileSync(REPORT_PATH, csvHeader + csvRows.join("\n"));

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total URLs checked   : ${uniqueUrls.length}`);
  console.log(`Broken found         : ${broken.length}`);
  console.log(`Successfully synced  : ${synced}`);
  console.log(`Still broken         : ${stillBroken.length}`);
  console.log(`Report               : ${REPORT_PATH}`);

  if (stillBroken.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
