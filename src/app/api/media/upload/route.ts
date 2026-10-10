import { NextRequest, NextResponse } from "next/server";
import { saveLocalMedia, STORAGE_BUCKETS, StorageBucket } from "@/lib/storage";
import crypto from "crypto";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
];

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as StorageBucket | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in form data" },
        { status: 400 }
      );
    }

    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        {
          error: `Invalid bucket. Allowed buckets: ${Object.values(STORAGE_BUCKETS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const mimeType = file.type.toLowerCase();
    const isImageBucket =
      bucket === STORAGE_BUCKETS.AVATARS || bucket === STORAGE_BUCKETS.ROOM_BANNERS;
    const isAudioBucket = bucket === STORAGE_BUCKETS.AUDIO_BIOS;

    // Validate media type and file size
    if (isImageBucket) {
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        return NextResponse.json(
          {
            error: `Invalid image type '${mimeType}'. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `Image file exceeds maximum allowed size of 5MB` },
          { status: 400 }
        );
      }
    } else if (isAudioBucket) {
      if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) {
        return NextResponse.json(
          {
            error: `Invalid audio type '${mimeType}'. Allowed: ${ALLOWED_AUDIO_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      if (file.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: `Audio file exceeds maximum allowed size of 10MB` },
          { status: 400 }
        );
      }
    }

    // Determine extension
    const ext = EXTENSION_MAP[mimeType] || "bin";
    const uniqueId = crypto.randomUUID();
    const fileName = `${Date.now()}-${uniqueId}.${ext}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save media to local storage pipeline
    const mediaResult = await saveLocalMedia(bucket, fileName, buffer);

    return NextResponse.json({
      success: true,
      url: mediaResult.url,
      fileName,
      bucket,
      size: file.size,
      mimeType,
    });
  } catch (error: unknown) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
