import fs from "fs";
import path from "path";
import type {
  UploadBatchDto,
  UploadListItemDto,
} from "../../../shared/types/uploads";

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

const toPublicUrl = (batchName: string, fileName: string) => {
  return `/static/test-uploads/${encodeURIComponent(
    batchName
  )}/${encodeURIComponent(fileName)}`;
};

export const readTestUploadBatches = async (): Promise<UploadBatchDto[]> => {
  const directories = await safeReadDir(TEST_UPLOAD_ROOT);
  const batches: UploadBatchDto[] = [];
  let virtualId = -1;

  for (const entry of directories) {
    if (!entry.isDirectory()) {
      continue;
    }

    const batchName = entry.name;
    const batchPath = path.join(TEST_UPLOAD_ROOT, batchName);
    const files = await safeReadDir(batchPath);
    const items: UploadListItemDto[] = [];
    let totalSize = 0;

    for (const fileEntry of files) {
      if (!fileEntry.isFile()) {
        continue;
      }

      const extension = path.extname(fileEntry.name).toLowerCase();
      if (!allowedExtensions.has(extension)) {
        continue;
      }

      const absolutePath = path.join(batchPath, fileEntry.name);
      const stats = await fsp.stat(absolutePath);

      totalSize += stats.size;
      const item: UploadListItemDto = {
        id: `${batchName}-${fileEntry.name}`,
        originalName: fileEntry.name,
        filename: fileEntry.name,
        url: toPublicUrl(batchName, fileEntry.name),
        mimetype: getMimeType(extension),
        size: stats.size,
        convertedFromPsd: false,
      };
      items.push(item);
    }

    if (items.length === 0) {
      continue;
    }

    items.sort((a, b) => a.filename.localeCompare(b.filename, "ko"));

    batches.push({
      id: virtualId--,
      uuid: `test-${batchName}`,
      title: batchName,
      status: "test",
      fileCount: items.length,
      totalSize,
      items,
      isTest: true,
    });
  }

  return batches;
};
