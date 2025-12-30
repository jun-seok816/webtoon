"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTestUploadBatches = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const TEST_UPLOAD_ROOT = path_1.default.join(__dirname, "../../data/test_uploads");
const fsp = fs_1.default.promises;
const allowedExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".bmp",
]);
const getMimeType = (ext) => {
    switch (ext) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".webp":
            return "image/webp";
        case ".gif":
            return "image/gif";
        case ".bmp":
            return "image/bmp";
        default:
            return "application/octet-stream";
    }
};
const safeReadDir = async (directory) => {
    try {
        return await fsp.readdir(directory, { withFileTypes: true });
    }
    catch (error) {
        const err = error;
        if (err.code === "ENOENT") {
            return [];
        }
        throw error;
    }
};
const readTestUploadBatches = async () => {
    const directories = await safeReadDir(TEST_UPLOAD_ROOT);
    const batches = {
        items: [],
        id: -1,
        uuid: (0, crypto_1.randomUUID)(),
        title: "테스트 작업환경",
        status: "completed",
        fileCount: 2,
        totalSize: 0,
        isTest: true,
    };
    for (const fileEntry of directories) {
        if (!fileEntry.isFile()) {
            continue;
        }
        const extension = path_1.default.extname(fileEntry.name).toLowerCase();
        if (!allowedExtensions.has(extension)) {
            continue;
        }
        const absolutePath = path_1.default.join(TEST_UPLOAD_ROOT, fileEntry.name);
        const stats = await fsp.stat(absolutePath);
        batches.totalSize += stats.size;
        const item = {
            id: `${fileEntry.name}`,
            originalName: fileEntry.name,
            filename: fileEntry.name,
            url: path_1.default.posix.join("/data/test_uploads/", fileEntry.name),
            mimetype: getMimeType(extension),
            size: stats.size,
            convertedFromPsd: false,
        };
        batches.items.push(item);
    }
    return [batches];
};
exports.readTestUploadBatches = readTestUploadBatches;
//# sourceMappingURL=testUploads.js.map