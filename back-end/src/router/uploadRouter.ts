import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const uploadRouter = Router();

const uploadRoot = path.join(__dirname, "../../data/uploads");

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
    (file as Express.Multer.File & { uniqueId?: string }).uniqueId = uniqueId;
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

uploadRouter.post(
  "/",
  upload.array("images", 20),
  (req: Request, res: Response|any) => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "최소 한 개 이상의 이미지를 업로드해야 합니다.",
      });
    }

    const title = (req.body?.title as string | undefined) ?? "";

    const items = files.map((file) => {
      const uniqueId =
        (file as Express.Multer.File & { uniqueId?: string }).uniqueId ??
        path.parse(file.filename).name;
      return {
        id: uniqueId,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: `/data/uploads/${file.filename}`,
      };
    });

    return res.json({
      success: true,
      title,
      count: items.length,
      items,
    });
  }
);

export default uploadRouter;
