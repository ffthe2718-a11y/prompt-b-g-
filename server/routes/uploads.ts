import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import db, { newId, nowIso } from "../db";
import { AuthedRequest, rateLimit, requireAuth, requireSalonOwner } from "../auth";
import { ApiError } from "../validation";

const router = Router();
router.use(requireAuth);

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 6);
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: "Too many uploads. Please wait a moment and try again.",
  key: (req) => `upload:${(req as AuthedRequest).user?.id ?? req.ip}`,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!allowed.has(file.mimetype)) {
      return callback(new ApiError(400, "Upload a JPG, PNG, WebP or GIF image.", "invalid_file_type"));
    }
    callback(null, true);
  },
});

/** Detect the actual image type from file bytes rather than trusting the MIME header. */
function detectImage(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (buffer.length >= 6 && buffer.subarray(0, 4).toString("ascii") === "GIF8") {
    return { ext: "gif", mime: "image/gif" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

router.post("/", uploadLimiter, upload.single("file"), (req, res, next) => {
  try {
    const user = (req as AuthedRequest).user!;
    const salon = requireSalonOwner(user.id);
    if (!req.file) throw new ApiError(400, "Choose an image to upload.", "no_file");
    const detected = detectImage(req.file.buffer);
    if (!detected) throw new ApiError(400, "That file is not a valid image.", "invalid_file");

    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${detected.ext}`;
    const directory = path.join(process.cwd(), "data", "uploads", salon.id);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, filename), req.file.buffer);

    const url = `/uploads/${salon.id}/${filename}`;
    db.prepare(
      "INSERT INTO uploads (id, salon_id, user_id, url, filename, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(newId(), salon.id, user.id, url, filename, detected.mime, req.file.size, nowIso());

    res.status(201).json({ url, mimeType: detected.mime, size: req.file.size, maxUploadMb });
  } catch (error) {
    next(error);
  }
});

export default router;
