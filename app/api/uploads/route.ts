import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Role } from "@/generated/prisma/enums";
import { badRequest } from "@/lib/api/errors";
import { route } from "@/lib/api/route";
import { requireRole } from "@/lib/auth/guards";

const MAX_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Stores product and profile images on the local disk. The only thing the rest
 * of the app knows is the returned URL, so swapping in S3 or UploadThing later
 * means rewriting this handler and nothing else.
 */
export const POST = route(async (request) => {
  await requireRole(Role.MERCHANT, Role.SUPER_ADMIN, Role.CUSTOMER);

  const form = await request.formData().catch(() => {
    throw badRequest("Expected a multipart form upload");
  });

  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("No file was uploaded");
  if (file.size === 0) throw badRequest("The uploaded file is empty");
  if (file.size > MAX_BYTES) throw badRequest("Images must be 4 MB or smaller");

  const extension = EXTENSIONS[file.type];
  if (!extension) throw badRequest("Upload a JPEG, PNG, WEBP, AVIF or GIF image");

  const name = `${randomUUID()}${extension}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(UPLOAD_DIR, name),
    Buffer.from(await file.arrayBuffer()),
  );

  return { url: `/uploads/${name}`, name: file.name, size: file.size };
});
