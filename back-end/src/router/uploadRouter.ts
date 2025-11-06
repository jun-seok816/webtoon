import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { readPsd } from "ag-psd";
import sharp from "sharp";
import { OkPacket, RowDataPacket } from "mysql2/promise";
import type {
  UploadBatchDto,
  UploadListItemDto,
  UploadListResponseDto,
} from "../../../shared/types/uploads";

type StoredFile = Express.Multer.File & { uniqueId?: string };
type ProcessedUpload = {
  id: string;
  originalName: string;
  filename: string;
  storagePath: string;
  mimetype: string;
  size: number;
  url: string;
  convertedFromPsd: boolean;
};

type UploadRow = RowDataPacket & {
  batch_id: number;
  upload_uuid: string;
  original_name: string;
  stored_filename: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  file_size: number;
  converted_from_psd: number;
  batch_uuid: string;
  title: string | null;
  status: string;
  file_count: number;
  total_size: number;
};

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

uploadRouter.use((req, res, next) => process._myApp.checkSession(req, res, next));

uploadRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      const payload: UploadListResponseDto = {
        success: false,
        message: "세션 정보가 유효하지 않습니다.",
      };
      res.status(500).json(payload);
      return;
    }

    const [rows] = await process._myApp.db
      .promise()
      .query<UploadRow[]>(
        `SELECT
          u.batch_id,
          u.upload_uuid,
          u.original_name,
          u.stored_filename,
          u.storage_path,
          u.public_url,
          u.mime_type,
          u.file_size,
          u.converted_from_psd,
          b.batch_uuid,
          b.title,
          b.status,
          b.file_count,
          b.total_size
        FROM user_uploads AS u
        INNER JOIN upload_batches AS b ON u.batch_id = b.id
        WHERE u.user_id = ?
        ORDER BY b.id DESC, u.upload_uuid ASC`,
        [userId]
      );

    const batchesMap = new Map<number, UploadBatchDto>();

    rows.forEach((row) => {
      if (!batchesMap.has(row.batch_id)) {
        batchesMap.set(row.batch_id, {
          id: row.batch_id,
          uuid: row.batch_uuid,
          title: row.title,
          status: row.status,
          fileCount: 0,
          totalSize: 0,
          items: [],
        });
      }

      const batch = batchesMap.get(row.batch_id)!;
      const item: UploadListItemDto = {
        id: row.upload_uuid,
        originalName: row.original_name,
        filename: row.stored_filename,
        url: row.public_url,
        mimetype: row.mime_type,
        size: row.file_size,
        convertedFromPsd: Boolean(row.converted_from_psd),
      };
      batch.items.push(item);
      batch.fileCount += 1;
      batch.totalSize += row.file_size;
    });

    const payload: UploadListResponseDto = {
      success: true,
      batches: Array.from(batchesMap.values()),
    };

    res.json(payload);
  } catch (error) {
    console.error("[upload] 업로드 목록 조회 실패", error);
    const payload: UploadListResponseDto = {
      success: false,
      message: "업로드 목록을 불러오는 중 오류가 발생했습니다.",
    };
    res.status(500).json(payload);
  }
});

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

    const rawTitle = typeof req.body?.title === "string" ? req.body.title : undefined;
    const normalizedTitle = rawTitle?.trim();
    const title = normalizedTitle ? normalizedTitle : null;

    try {
      const userId = req.session?.userId;


      const processed = await Promise.all(
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

              const stats = await fsp.stat(outputPath);

              const item: ProcessedUpload = {
                id: uniqueId,
                originalName: file.originalname,
                filename: pngFilename,
                storagePath: outputPath,
                mimetype: "image/png",
                size: stats.size,
                url: `/data/uploads/${pngFilename}`,
                convertedFromPsd: true,
              };
              return item;
            } catch (error) {
              console.error("[upload] PSD 변환 실패", error);
            }
          }

          const tempPath = `${file.path}.tmp`;
          await sharp(file.path)
            .resize({ width: 1000, fit: "inside", withoutEnlargement: true })
            .toFile(tempPath);
          await fsp.rename(tempPath, file.path);

          const stats = await fsp.stat(file.path);

          const item: ProcessedUpload = {
            id: uniqueId,
            originalName: file.originalname,
            filename: file.filename,
            storagePath: file.path,
            mimetype: file.mimetype,
            size: stats.size,
            url: `/data/uploads/${file.filename}`,
            convertedFromPsd: false,
          };
          return item;
        })
      );

      const items = processed.filter(
        (item): item is ProcessedUpload => Boolean(item)
      );

      if (items.length === 0) {
        res.status(500).json({
          success: false,
          message: "업로드한 파일을 처리하지 못했습니다.",
        });
        return;
      }

      const batchUuid = uuidv4();
      const fileCount = items.length;
      const totalSize = items.reduce((sum, item) => sum + item.size, 0);

      const connection = await process._myApp.db.promise().getConnection();

      try {
        await connection.beginTransaction();

        const [batchResult] = await connection.query<OkPacket>(
          `INSERT INTO upload_batches (
            user_id,
            batch_uuid,
            title,
            status,
            file_count,
            total_size
          ) VALUES (?, ?, ?, 'completed', ?, ?)`,
          [userId, batchUuid, title, fileCount, totalSize]
        );

        const batchId = Number(batchResult.insertId);

        const values = items.map((item) => [
          userId,
          batchId,
          item.id,
          item.originalName,
          item.filename,
          item.storagePath,
          item.url,
          item.mimetype,
          item.size,
          item.convertedFromPsd ? 1 : 0,
        ]);

        await connection.query<OkPacket>(
          `INSERT INTO user_uploads (
            user_id,
            batch_id,
            upload_uuid,
            original_name,
            stored_filename,
            storage_path,
            public_url,
            mime_type,
            file_size,
            converted_from_psd
          ) VALUES ?`,
          [values]
        );

        await connection.commit();

        res.json({
          success: true,
          batch: {
            id: batchId,
            uuid: batchUuid,
            title,
            fileCount,
            totalSize,
          },
          items: items.map((item) => ({
            id: item.id,
            originalName: item.originalName,
            filename: item.filename,
            url: item.url,
            mimetype: item.mimetype,
            size: item.size,
            convertedFromPsd: item.convertedFromPsd,
          })),
        });
      } catch (error) {
        await connection.rollback();
        console.error("[upload] DB 저장 실패", error);
        res.status(500).json({
          success: false,
          message: "업로드 정보를 저장하는 중 오류가 발생했습니다.",
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("[upload] 처리 중 오류", error);
      res.status(500).json({
        success: false,
        message: "업로드 처리 중 오류가 발생했습니다.",
      });
    }
  }
);

export default uploadRouter;
