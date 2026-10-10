import { StorageBucket, STORAGE_BUCKETS } from "./storage";

export interface MediaUploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  bucket: StorageBucket;
  size: number;
  mimeType: string;
}

/**
 * Uploads an image or audio file to the media storage API
 */
export async function uploadMedia(
  file: File,
  bucket: StorageBucket
): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);

  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data;
}

/**
 * Convenience method for uploading a user profile avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  const result = await uploadMedia(file, STORAGE_BUCKETS.AVATARS);
  return result.url;
}

/**
 * Convenience method for uploading a room banner
 */
export async function uploadRoomBanner(file: File): Promise<string> {
  const result = await uploadMedia(file, STORAGE_BUCKETS.ROOM_BANNERS);
  return result.url;
}

/**
 * Convenience method for uploading a 30-second audio bio recording
 */
export async function uploadAudioBio(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], `audio-bio-${Date.now()}.webm`, {
    type: audioBlob.type || "audio/webm",
  });
  const result = await uploadMedia(file, STORAGE_BUCKETS.AUDIO_BIOS);
  return result.url;
}
