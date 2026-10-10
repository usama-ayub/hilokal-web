import * as Minio from "minio";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
const MINIO_PORT = Number(process.env.MINIO_PORT) || 9000;
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadminpassword123";

/**
 * MinIO S3-Compatible Client Singleton
 */
export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

export const STORAGE_BUCKETS = {
  AVATARS: process.env.MINIO_BUCKET_AVATARS || "avatars",
  ROOM_BANNERS: process.env.MINIO_BUCKET_BANNERS || "room-banners",
  AUDIO_BIOS: process.env.MINIO_BUCKET_AUDIO_BIOS || "audio-bios",
} as const;

/**
 * Generate a pre-signed PUT URL so client browsers can upload files directly to MinIO
 * without stressing the Node.js API server RAM or CPU.
 * 
 * @param bucket Name of the destination bucket (avatars, room-banners, audio-bios)
 * @param objectKey Destination file path inside the bucket
 * @param expirySeconds Expiration duration for the upload URL (default: 15 minutes)
 */
export async function getPresignedUploadUrl(
  bucket: string,
  objectKey: string,
  expirySeconds: number = 900
): Promise<string> {
  return await minioClient.presignedPutObject(bucket, objectKey, expirySeconds);
}

/**
 * Construct the public download URL for an uploaded file
 */
export function getPublicMediaUrl(bucket: string, objectKey: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || `http://${MINIO_ENDPOINT}:${MINIO_PORT}`;
  return `${baseUrl}/${bucket}/${objectKey}`;
}
