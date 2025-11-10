import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const fileRouter = Router();

const uploadsRoot = path.join(__dirname, "../../data/uploads");
const testUploadsRoot = path.join(__dirname, "../../data/test_uploads");
const fsp = fs.promises;

const resolveSafePath = (root: string, requested: string) => {
  if (!requested) {
    throw new Error("파일명이 필요합니다.");
  }

  const normalized = requested.replace(/\\/g, "/");
  const candidate = path.resolve(root, normalized);
  const relative = path.relative(root, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("잘못된 파일 경로입니다.");
  }

  return candidate;
};

const sendFileFromRoot = async (root: string, requested: string, res: Response) => {
  try {
    const filePath = resolveSafePath(root, requested);
    const exists = await fsp
      .access(filePath, fs.constants.R_OK)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      res.status(404).json({
        success: false,
        message: "파일을 찾을 수 없습니다.",
      });
      return;
    }

    res.sendFile(filePath);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "파일명이 필요합니다."
        ? error.message
        : error instanceof Error && error.message === "잘못된 파일 경로입니다."
        ? error.message
        : "파일을 전송하는 중 오류가 발생했습니다.";

    const status =
      message === "파일명이 필요합니다." || message === "잘못된 파일 경로입니다."
        ? 400
        : 500;

    if (status === 500) {
      console.error("[files] 파일 응답 실패", error);
    }

    res.status(status).json({
      success: false,
      message,
    });
  }
};

fileRouter.get("/uploads/:filename", async (req: Request, res: Response) => {
  await sendFileFromRoot(uploadsRoot, req.params.filename, res);
});

fileRouter.get("/test_uploads/:filePath(*)", async (req: Request, res: Response) => {
  const requestedPath = req.params.filePath;
  await sendFileFromRoot(testUploadsRoot, requestedPath, res);
});

export default fileRouter;
