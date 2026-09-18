import { getUserId, jsonError } from "@/lib/api";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, imageUrl, uploadImage } from "@/lib/cloudinary";

// POST multipart/form-data with a `file` field → { publicId, url }
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError("Unauthorized", 401);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return jsonError("Expected a multipart form with a file", 400);
  }

  if (!(file instanceof File) || file.size === 0) return jsonError("No image provided", 400);
  if (!IMAGE_TYPES.includes(file.type))
    return jsonError("Only JPG, PNG, WebP or GIF images are allowed", 400);
  if (file.size > MAX_IMAGE_BYTES) return jsonError("Image must be 5 MB or smaller", 400);

  try {
    const result = await uploadImage(Buffer.from(await file.arrayBuffer()), userId);
    return Response.json({ publicId: result.public_id, url: imageUrl(result.public_id) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload", error);
    return jsonError("Image upload failed", 502);
  }
}
