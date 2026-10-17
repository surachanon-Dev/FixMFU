import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { MAX_REPORT_BYTES, ReportError } from "./report-validation";

export interface ReportPhoto { id: string; object_path: string; original_name: string; mime_type: "image/webp"; size_bytes: number }
export interface PreparedPhoto { metadata: ReportPhoto; bytes: Buffer }

export async function prepareReportImages(id: string, files: File[]): Promise<PreparedPhoto[]> {
  const photos: PreparedPhoto[] = [];
  for (const file of files) {
    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16_000_000, animated: false, failOn: "warning" });
      const info = await image.metadata();
      if (!info.format || !["jpeg", "png", "webp"].includes(info.format) || (info.pages ?? 1) > 1) throw new Error("Unsupported image");
      const bytes = await image.rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const hash = createHash("sha256").update(id).update(file.name).update(bytes).digest("hex");
      const photoId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      photos.push({ bytes, metadata: { id: photoId, object_path: `${id}/report/${photoId}.webp`, original_name: file.name, mime_type: "image/webp", size_bytes: bytes.length } });
    } catch {
      throw new ReportError("อ่านรูปไม่สำเร็จ กรุณาใช้รูป JPG, PNG หรือ WebP ที่เปิดดูได้ ขนาดไม่เกิน 16 ล้านพิกเซล");
    }
  }
  if (new Set(photos.map(photo => photo.metadata.id)).size !== photos.length) throw new ReportError("มีรูปซ้ำ กรุณาลบรูปซ้ำแล้วส่งใหม่");
  if (photos.reduce((sum, photo) => sum + photo.bytes.length, 0) > MAX_REPORT_BYTES) throw new ReportError("ขนาดรูปหลังประมวลผลเกิน 2 MB กรุณาเลือกรูปที่เล็กลง");
  return photos;
}
