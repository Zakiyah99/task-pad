import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
export { IMAGE_TYPES, MAX_IMAGE_BYTES } from "./validation";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  analytics: false, // no "?_a=..." tracking param on URLs (next/image rejects unexpected query strings)
});

/** Each user's images live in their own folder, so ownership can be checked from the public id. */
const userFolder = (userId: string) => `task-manager/${userId}`;

export const ownsImage = (publicId: string, userId: string) =>
  publicId.startsWith(`${userFolder(userId)}/`) && !publicId.includes("..");

/** Delivery URL with automatic format/quality, capped at 1600px wide. */
export const imageUrl = (publicId: string) =>
  cloudinary.url(publicId, {
    transformation: [{ width: 1600, crop: "limit" }, { fetch_format: "auto", quality: "auto" }],
  });

export function uploadImage(file: Buffer, userId: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: userFolder(userId), resource_type: "image" }, (error, result) =>
        error || !result ? reject(error ?? new Error("Upload failed")) : resolve(result),
      )
      .end(file);
  });
}

/** Best effort: a failed cleanup shouldn't fail the request. */
export async function deleteImage(publicId: string | null | undefined) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed", publicId, error);
  }
}
