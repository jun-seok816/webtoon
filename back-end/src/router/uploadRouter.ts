import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { readPsd } from "ag-psd";
import sharp from "sharp";

type StoredFile = Express.Multer.File & { uniqueId?: string };

const uploadRouter = Router();

const uploadRoot = path.join(__dirname, "../../data/uploads");
const fsp = fs.promises;

const ensureUploadRoot = () => {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadRoot();
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueId = uuidv4();
    (file as StoredFile).uniqueId = uniqueId;
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 20,
    fileSize: 20 * 1024 * 1024,
  },
});

const shouldConvertPsd = (file: StoredFile) => {
  return (
    file.mimetype === "image/vnd.adobe.photoshop" ||
    path.extname(file.originalname).toLowerCase() === ".psd"
  );
};

uploadRouter.post(
  "/",
  upload.array("images", 20),
  async (req: Request, res: Response) => {
    const files = (req.files as StoredFile[]) ?? [];

    if (files.length === 0) {
      res.status(400).json({
        success: false,
        message: "최소 한 개 이상의 이미지를 업로드해야 합니다.",
      });
      return;
    }

    const title = (req.body?.title as string | undefined) ?? "";

    const items = await Promise.all(
      files.map(async (file) => {
        const uniqueId = file.uniqueId ?? path.parse(file.filename).name;

        if (shouldConvertPsd(file)) {
          try {
            const buffer = await fsp.readFile(file.path);
            const psd = readPsd(buffer, { useImageData: true });
            const pngFilename = `${uniqueId}.png`;
            const outputPath = path.join(uploadRoot, pngFilename);

            if (!psd.imageData) {
              throw new Error("PSD 이미지 데이터를 읽어오지 못했습니다.");
            }

            const { data, width, height } = psd.imageData;
            const rawBuffer = Buffer.from(
              data.buffer,
              data.byteOffset,
              data.byteLength
            );

            await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
              .resize({ width: 1000, fit: "inside", withoutEnlargement: true })
              .png()
              .toFile(outputPath);

            await fsp.unlink(file.path).catch(() => undefined);

            return {
              id: uniqueId,
              originalName: file.originalname,
              filename: pngFilename,
              mimetype: "image/png",
              size: (await fsp.stat(outputPath)).size,
              url: `/data/uploads/${pngFilename}`,
              convertedFromPsd: true,
            };
          } catch (error) {
            console.error("[upload] PSD 변환 실패", error);
          }
        }

        const tempPath = `${file.path}.tmp`;
        await sharp(file.path)
          .resize({ width: 1000, fit: "inside", withoutEnlargement: true })
          .toFile(tempPath);
        await fsp.rename(tempPath, file.path);

        return {
          id: uniqueId,
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: (await fsp.stat(file.path)).size,
          url: `/data/uploads/${file.filename}`,
          convertedFromPsd: false,
        };
      })
    );

    res.json({
      success: true,
      title,
      count: items.length,
      items,
    });
  }
);

export default uploadRouter;
