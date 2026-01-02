"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const ag_psd_1 = require("ag-psd");
const sharp_1 = __importDefault(require("sharp"));
const testUploads_1 = require("../services/testUploads");
const uploadRouter = (0, express_1.Router)();
const uploadRoot = path_1.default.join(__dirname, "../../data/uploads");
const fsp = fs_1.default.promises;
const ensureUploadRoot = () => {
    if (!fs_1.default.existsSync(uploadRoot)) {
        fs_1.default.mkdirSync(uploadRoot, { recursive: true });
    }
};
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        ensureUploadRoot();
        cb(null, uploadRoot);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const uniqueId = (0, uuid_1.v4)();
        file.uniqueId = uniqueId;
        cb(null, `${uniqueId}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        files: 20,
        fileSize: 400 * 1024 * 1024,
    },
});
const shouldConvertPsd = (file) => {
    return (file.mimetype === "image/vnd.adobe.photoshop" ||
        path_1.default.extname(file.originalname).toLowerCase() === ".psd");
};
uploadRouter.use((req, res, next) => process._myApp.checkSession(req, res, next));
uploadRouter.get("/", async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            const payload = {
                success: false,
                message: "세션 정보가 유효하지 않습니다.",
            };
            res.status(500).json(payload);
            return;
        }
        const [rows] = await process._myApp.db
            .promise()
            .query(`SELECT
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
        ORDER BY b.id DESC, u.upload_uuid ASC`, [userId]);
        const batchesMap = new Map();
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
                    isTest: false,
                });
            }
            const batch = batchesMap.get(row.batch_id);
            const item = {
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
        const payload = {
            success: true,
            batches: Array.from(batchesMap.values()),
        };
        res.json(payload);
    }
    catch (error) {
        console.error("[upload] 업로드 목록 조회 실패", error);
        const payload = {
            success: false,
            message: "업로드 목록을 불러오는 중 오류가 발생했습니다.",
        };
        res.status(500).json(payload);
    }
});
uploadRouter.get("/test", async (_req, res) => {
    try {
        const batches = await (0, testUploads_1.readTestUploadBatches)();
        const payload = {
            success: true,
            batches,
        };
        res.json(payload);
    }
    catch (error) {
        console.error("[upload] 테스트 배치 조회 실패", error);
        const payload = {
            success: false,
            message: "테스트 배치를 불러오는 중 오류가 발생했습니다.",
        };
        res.status(500).json(payload);
    }
});
uploadRouter.post("/", upload.array("images", 20), async (req, res) => {
    const files = req.files ?? [];
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
        const processed = await Promise.all(files.map(async (file) => {
            const uniqueId = file.uniqueId ?? path_1.default.parse(file.filename).name;
            if (shouldConvertPsd(file)) {
                try {
                    const buffer = await fsp.readFile(file.path);
                    const psd = (0, ag_psd_1.readPsd)(buffer, { useImageData: true });
                    const pngFilename = `${uniqueId}.png`;
                    const outputPath = path_1.default.join(uploadRoot, pngFilename);
                    if (!psd.imageData) {
                        throw new Error("PSD 이미지 데이터를 읽어오지 못했습니다.");
                    }
                    const { data, width, height } = psd.imageData;
                    const rawBuffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
                    await (0, sharp_1.default)(rawBuffer, { raw: { width, height, channels: 4 } })
                        .resize({ width: 1000, fit: "inside", withoutEnlargement: true })
                        .png()
                        .toFile(outputPath);
                    await fsp.unlink(file.path).catch(() => undefined);
                    const stats = await fsp.stat(outputPath);
                    const item = {
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
                }
                catch (error) {
                    console.error("[upload] PSD 변환 실패", error);
                }
            }
            const tempPath = `${file.path}.tmp`;
            await (0, sharp_1.default)(file.path)
                .resize({ width: 1000, fit: "inside", withoutEnlargement: true })
                .toFile(tempPath);
            await fsp.rename(tempPath, file.path);
            const stats = await fsp.stat(file.path);
            const item = {
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
        }));
        const items = processed.filter((item) => Boolean(item));
        if (items.length === 0) {
            res.status(500).json({
                success: false,
                message: "업로드한 파일을 처리하지 못했습니다.",
            });
            return;
        }
        const batchUuid = (0, uuid_1.v4)();
        const fileCount = items.length;
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        const connection = await process._myApp.db.promise().getConnection();
        try {
            await connection.beginTransaction();
            const [batchResult] = await connection.query(`INSERT INTO upload_batches (
            user_id,
            batch_uuid,
            title,
            status,
            file_count,
            total_size
          ) VALUES (?, ?, ?, 'completed', ?, ?)`, [userId, batchUuid, title, fileCount, totalSize]);
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
            await connection.query(`INSERT INTO user_uploads (
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
          ) VALUES ?`, [values]);
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
        }
        catch (error) {
            await connection.rollback();
            console.error("[upload] DB 저장 실패", error);
            res.status(500).json({
                success: false,
                message: "업로드 정보를 저장하는 중 오류가 발생했습니다.",
            });
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error("[upload] 처리 중 오류", error);
        res.status(500).json({
            success: false,
            message: "업로드 처리 중 오류가 발생했습니다.",
        });
    }
});
exports.default = uploadRouter;
//# sourceMappingURL=uploadRouter.js.map