import fs from "fs";
import path from "path";

export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  ROOM_BANNERS: "room-banners",
  AUDIO_BIOS: "audio-bios",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Automatically ensures that local upload directories exist on disk.
 * Eliminates the need for any external MinIO container or Docker dependencies.
 */
export async function ensureBucketsExist(): Promise<void> {
  const buckets = Object.values(STORAGE_BUCKETS);

  for (const bucket of buckets) {
    const dirPath = path.join(UPLOADS_ROOT, bucket);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created local media directory: ${dirPath}`);
    }
  }
}

/**
 * Returns a public URL for a file stored either locally or in remote storage.
 */
export function getPublicMediaUrl(bucket: string, objectKey: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/uploads/${bucket}/${objectKey}`;
}

/**
 * Save an uploaded file buffer directly to disk.
 */
export async function saveLocalMedia(
  bucket: string,
  fileName: string,
  buffer: Buffer
): Promise<{ url: string; path: string }> {
  await ensureBucketsExist();
  const filePath = path.join(UPLOADS_ROOT, bucket, fileName);
  await fs.promises.writeFile(filePath, buffer);

  return {
    url: getPublicMediaUrl(bucket, fileName),
    path: filePath,
  };
}
