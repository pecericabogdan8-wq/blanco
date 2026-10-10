import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return jsonError("Додайте хоча б один файл");

    const outDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(outDir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      if (!ALLOWED.has(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
        return jsonError(`Непідтримуваний тип: ${file.name}`);
      }
      if (file.size > MAX_BYTES) {
        return jsonError(`Занадто великий файл: ${file.name}`);
      }

      const buf = Buffer.from(await file.arrayBuffer());
      const id = randomUUID().slice(0, 8);
      // ASCII-only filenames — Cyrillic paths break previews in some setups
      const base = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      const name = `${base || "product"}-${id}.jpg`;
      const dest = path.join(outDir, name);

      const jpg = await sharp(buf)
        .rotate()
        .resize({ width: 2200, height: 2800, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer();

      await writeFile(dest, jpg);
      urls.push(`/uploads/products/${name}`);
    }

    return jsonOk({ ok: true, urls });
  } catch (err) {
    return handleApiError(err);
  }
}
