import { Router, Request, Response } from "express";
import { translate } from "@vitalets/google-translate-api";
import type {
  TranslateRequestBody,
  TranslateResponseBody,
} from "../../../shared/types/translate";

const DEFAULT_TARGET_LANG = "eng";

const LANGUAGE_CODE_MAP: Record<string, string> = {
  eng: "en",
  kor: "ko",
  jpn: "ja",
  chi_sim: "zh-cn",
};

const mapToTranslateCode = (code?: string) => {
  if (!code) {
    return undefined;
  }
  const normalized = code.trim().toLowerCase();
  return LANGUAGE_CODE_MAP[normalized] ?? normalized;
};

type TranslateJob = {
  text: string;
  from?: string;
  to: string;
};

type QueueItem = {
  payload: TranslateJob;
  resolve: (value: Awaited<ReturnType<typeof translate>>) => void;
  reject: (reason?: unknown) => void;
};

const TRANSLATE_INTERVAL_MS = 15000;
const translateQueue: QueueItem[] = [];
let isProcessingQueue = false;
let lastInvocationTime = 0;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const processQueue = async () => {
  if (isProcessingQueue) {
    return;
  }
  isProcessingQueue = true;
  try {
    while (translateQueue.length > 0) {
      const job = translateQueue.shift();
      if (!job) {
        continue;
      }

      const elapsed = Date.now() - lastInvocationTime;
      if (elapsed < TRANSLATE_INTERVAL_MS) {
        await sleep(TRANSLATE_INTERVAL_MS - elapsed);
      }

      try {
        const result = await translate(job.payload.text, {
          from: job.payload.from,
          to: job.payload.to,
        });
        lastInvocationTime = Date.now();
        job.resolve(result);
      } catch (err) {
        lastInvocationTime = Date.now();
        job.reject(err);
      }
    }
  } finally {
    isProcessingQueue = false;
    if (translateQueue.length > 0) {
      processQueue();
    }
  }
};

const enqueueTranslate = (payload: TranslateJob) =>
  new Promise<Awaited<ReturnType<typeof translate>>>((resolve, reject) => {
    translateQueue.push({ payload, resolve, reject });
    void processQueue();
  });

const translateRouter = Router();

translateRouter.use((req, res, next) => process._myApp.checkSession(req, res, next));

translateRouter.post(
  "/",
  async (
    req: Request<unknown, unknown, TranslateRequestBody>,
    res: Response<TranslateResponseBody>
  ) => {
    try {
      const { text, sourceLang, targetLang } = req.body ?? {};
      if (typeof text !== "string" || text.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "번역할 텍스트를 전달해주세요.",
        });
        return;
      }

      const normalizedTarget =
        typeof targetLang === "string" && targetLang.trim().length > 0
          ? targetLang.trim()
          : DEFAULT_TARGET_LANG;
      const normalizedSource =
        typeof sourceLang === "string" && sourceLang.trim().length > 0
          ? sourceLang.trim()
          : undefined;

      const translateTarget =
        mapToTranslateCode(normalizedTarget) ?? normalizedTarget;
      const translateSource =
        mapToTranslateCode(normalizedSource) ?? normalizedSource;

      const translation = await enqueueTranslate({
        text,
        from: translateSource,
        to: translateTarget,
      });

      const responsePayload: TranslateResponseBody = {
        success: true,
        translatedText: translation.text,
        originalText: text,
        sourceLang:normalizedSource??"kor",          
        targetLang: normalizedTarget,
      };

      res.json(responsePayload);
    } catch (error) {
      console.error("[translate] 번역 처리 실패", error);
      const code =
        typeof error === "object" &&
        error &&
        "code" in error &&
        typeof (error as { code?: string }).code === "string"
          ? (error as { code: string }).code
          : undefined;

      const status = code === "BAD_REQUEST" ? 400 : 500;
      res.status(status).json({
        success: false,
        message:
          status === 400
            ? "지원하지 않는 언어 코드입니다."
            : "요청 과다로 인한 IP 차단, 번역API 호출 실패",
        code,
      });
    }
  }
);

export default translateRouter;
