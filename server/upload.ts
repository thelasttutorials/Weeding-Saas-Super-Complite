import multer from "multer";
import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

// ── Constants ─────────────────────────────────────────────────────────────────
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIMETYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
]);

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

// ── Magic-bytes signatures ─────────────────────────────────────────────────────
type Signature = { offset: number; bytes: number[] };

const MAGIC_SIGNATURES: Array<{ mime: string; sig: Signature[] }> = [
  {
    mime: "image/jpeg",
    sig: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  },
  {
    mime: "image/png",
    sig: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  },
  {
    mime: "image/webp",
    sig: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },   // RIFF
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },   // WEBP
    ],
  },
  {
    mime: "application/pdf",
    sig: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  },
  {
    mime: "audio/mpeg",
    sig: [
      { offset: 0, bytes: [0x49, 0x44, 0x33] }, // ID3
      { offset: 0, bytes: [0xff, 0xfb] },       // MP3 Frame
    ],
  },
  {
    mime: "audio/mp4",
    sig: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41] }], // ftypM4A
  },
  {
    mime: "audio/ogg",
    sig: [{ offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }], // OggS
  },
  {
    mime: "audio/wav",
    sig: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
      { offset: 8, bytes: [0x57, 0x41, 0x56, 0x45] }, // WAVE
    ],
  },
];

function detectMimeFromBuffer(buf: Buffer): string | null {
  for (const { mime, sig } of MAGIC_SIGNATURES) {
    const match = sig.every(({ offset, bytes }) =>
      bytes.every((b, i) => buf[offset + i] === b)
    );
    if (match) return mime;
  }
  return null;
}

// ── Multer: memory storage (validate before writing to disk) ──────────────────
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
      return cb(new Error(`Tipe file tidak diizinkan. Hanya JPG, PNG, WebP, PDF, dan Audio (MP3, M4A, OGG, WAV).`));
    }
    cb(null, true);
  },
}).single("file");

// ── Validate magic bytes + write file to disk ─────────────────────────────────
export interface SavedFile {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
}

export function validateAndSaveFile(file: Express.Multer.File): SavedFile {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // Validate magic bytes (don't trust content-type header)
  const detectedMime = detectMimeFromBuffer(file.buffer);
  if (!detectedMime) {
    throw new Error("File tidak valid. Konten tidak sesuai dengan format yang diizinkan.");
  }

  // Ensure detected MIME matches declared MIME (or at least is in allowed list)
  if (!ALLOWED_MIMETYPES.has(detectedMime)) {
    throw new Error("Tipe file tidak diizinkan. Hanya JPG, PNG, WebP, PDF, dan Audio (MP3, M4A, OGG, WAV).");
  }

  // JPEG variants: both image/jpeg and image/jpg map to same magic bytes
  if (detectedMime === "image/jpeg" && file.mimetype !== "image/jpeg" && file.mimetype !== "image/jpg") {
    throw new Error("Tipe file tidak sesuai dengan konten yang diupload.");
  }
  if (detectedMime !== "image/jpeg" && detectedMime !== file.mimetype) {
    throw new Error("Tipe file tidak sesuai dengan konten yang diupload.");
  }

  // Safe filename: UUID + correct extension from detected MIME
  const ext = ALLOWED_EXTENSIONS[detectedMime] || "bin";
  const storedName = `${randomUUID()}.${ext}`;
  const destPath = path.join(UPLOAD_DIR, storedName);

  writeFileSync(destPath, file.buffer);

  return {
    originalName: sanitizeFilename(file.originalname),
    storedName,
    mimeType: detectedMime,
    size: file.size,
    url: `/uploads/${storedName}`,
  };
}

function sanitizeFilename(name: string): string {
  // Remove path traversal chars, null bytes, and truncate
  return name
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\0/g, "")
    .slice(0, 200);
}
