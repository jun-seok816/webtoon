import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const fileRouter = Router();

const uploadsRoot = path.join(__dirname, "../../data/uploads");
const fsp = fs.promises;

fileRouter.get("/uploads/:filename", async (req: Request, res: Response) => {
  try {
    const requested = req.params.filename;
    if (!requested) {
      res.status(400).json({
        success: false,
        message: "파일명이 필요합니다.",
      });
      return;
    }

    const safeName = path.basename(requested);
    const filePath = path.resolve(uploadsRoot, safeName);
    const relative = path.relative(uploadsRoot, filePath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      res.status(400).json({
        success: false,
        message: "잘못된 파일 경로입니다.",
      });
      return;
    }

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
    console.error("[files] 파일 응답 실패", error);
    res.status(500).json({
      success: false,
      message: "파일을 전송하는 중 오류가 발생했습니다.",
    });
  }
});

export default fileRouter;
