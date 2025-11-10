import fs from "fs";
import path from "path";
import type {
  UploadBatchDto,
  UploadListItemDto,
} from "../../../shared/types/uploads";
import { randomUUID } from "crypto";

const TEST_UPLOAD_ROOT = path.join(__dirname, "../../data/test_uploads");
const fsp = fs.promises;

const allowedExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
]);

const getMimeType = (ext: string) => {
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

const safeReadDir = async (directory: string) => {
  try {
    return await fsp.readdir(directory, { withFileTypes: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};


export const readTestUploadBatches = async (): Promise<UploadBatchDto[]> => {
  const directories = await safeReadDir(TEST_UPLOAD_ROOT);
  const batches: UploadBatchDto = {
    items: [],
    id: -1,
    uuid: randomUUID(),
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

    const extension = path.extname(fileEntry.name).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    const absolutePath = path.join(TEST_UPLOAD_ROOT, fileEntry.name);
    const stats = await fsp.stat(absolutePath);

    batches.totalSize += stats.size;
    const item: UploadListItemDto = {
      id: `${fileEntry.name}`,
      originalName: fileEntry.name,
      filename: fileEntry.name,
      url: path.posix.join("/data/test_uploads/", fileEntry.name),
      mimetype: getMimeType(extension),
      size: stats.size,
      convertedFromPsd: false,
    };
    batches.items.push(item);
  }

  return [batches];
};
