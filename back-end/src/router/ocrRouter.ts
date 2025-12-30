import { Router, Request, Response } from "express";
import Tesseract from "tesseract.js";
import type { OcrRequestBody } from "@shared/types/ocr";

const DEFAULT_LANGUAGE = "eng";

const stripBase64Prefix = (payload: string) => {
  const trimmed = payload.trim();
  if (!trimmed) {
    return trimmed;
  }

  const commaIndex = trimmed.indexOf(",");
  if (trimmed.startsWith("data:") && commaIndex !== -1) {
    return trimmed.slice(commaIndex + 1);
  }
  return trimmed;
};

const decodeBase64Image = (input: string) => {
  const normalized = stripBase64Prefix(input);
  if (!normalized) {
    throw new Error("payload_empty");
  }

  try {
    return Buffer.from(normalized, "base64");
  } catch {
    throw new Error("payload_invalid");
  }
};

const ocrRouter = Router();

ocrRouter.use((req, res, next) => process._myApp.checkSession(req, res, next));

ocrRouter.post(
  "/",
  async (req: Request<unknown, unknown, OcrRequestBody>, res: Response) => {
    try {
      const { image, language } = req.body ?? {};
      if (!image || typeof image !== "string") {
        res.status(400).json({
          success: false,
          message: "image 필드에 base64 문자열을 전달해야 합니다.",
        });
        return;
      }

      const imageBuffer = decodeBase64Image(image);
      if (!imageBuffer.length) {
        res.status(400).json({
          success: false,
          message: "전달된 이미지 데이터가 비어 있습니다.",
        });
        return;
      }

      const lang =
        typeof language === "string" && language.trim().length > 0
          ? language.trim()
          : DEFAULT_LANGUAGE;

      const recognizeResult = await Tesseract.recognize(imageBuffer, lang, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            const progress = Math.round((message.progress ?? 0) * 100);
            console.log(`[ocr] progress ${progress}%`);
          }
        },
      });

      const words =
        recognizeResult.data.blocks?.map((word) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })) ?? [];

      res.json({
        success: true,
        text: recognizeResult.data.text?.trim() ?? "",
        confidence: recognizeResult.data.confidence ?? null,
        words,
      });
    } catch (error) {
      console.error("[ocr] OCR 처리 실패", error);
      res.status(500).json({
        success: false,
        message: "이미지에서 텍스트를 추출하는 중 오류가 발생했습니다.",
      });
    }
  }
);

export default ocrRouter;
