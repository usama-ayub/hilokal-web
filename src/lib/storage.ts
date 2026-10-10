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
 * Automatically ensure that required MinIO buckets exist and configure public read policies.
 * Eliminates the need for external `mc` CLI or auxiliary init containers.
 */
export async function ensureBucketsExist(): Promise<void> {
  const buckets = Object.values(STORAGE_BUCKETS);

  for (const bucket of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, "us-east-1");
        console.log(`Created MinIO storage bucket: ${bucket}`);

        // Set public read policy for avatars and room banners
        if (bucket === STORAGE_BUCKETS.AVATARS || bucket === STORAGE_BUCKETS.ROOM_BANNERS) {
          const publicPolicy = {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          };
          await minioClient.setBucketPolicy(bucket, JSON.stringify(publicPolicy));
        }
      }
    } catch (err) {
      console.error(`Error ensuring MinIO bucket ${bucket}:`, err);
    }
  }
}

/**
 * Generate a pre-signed PUT URL so client browsers can upload files directly to MinIO
 * without stressing the Node.js API server RAM or CPU.
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
