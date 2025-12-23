import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

const storage = new Storage({
  apiEndpoint: process.env.REPLIT_SIDECAR_ENDPOINT,
  projectId: "replit",
  credentials: { client_email: "replit", private_key: "replit" }
});

const bucketName = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID!;
const bucket = storage.bucket(bucketName);

const DOWNLOAD_DIR = path.join(process.cwd(), "bucket_export");

async function run() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const [files] = await bucket.getFiles({ prefix: "uploads/" });

  console.log(`Found ${files.length} files`);

  for (const file of files) {
    const localPath = path.join(DOWNLOAD_DIR, file.name);
    const dir = path.dirname(localPath);

    fs.mkdirSync(dir, { recursive: true });

    await file.download({ destination: localPath });
    console.log("Downloaded:", file.name);
  }

  console.log("✅ Export complete");
}

run().catch(console.error);
