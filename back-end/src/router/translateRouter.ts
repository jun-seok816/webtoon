import { Router, Request, Response } from "express";
import translate from "google-translate-api";
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

const REVERSE_LANGUAGE_CODE_MAP = Object.entries(LANGUAGE_CODE_MAP).reduce<
  Record<string, string>
>((acc, [appCode, translateCode]) => {
  acc[translateCode] = appCode;
  return acc;
}, {});

const mapToTranslateCode = (code?: string) => {
  if (!code) {
    return undefined;
  }
  const normalized = code.trim().toLowerCase();
  return LANGUAGE_CODE_MAP[normalized] ?? normalized;
};

const mapToAppCode = (code?: string) => {
  if (!code) {
    return undefined;
  }
  const normalized = code.trim().toLowerCase();
  return REVERSE_LANGUAGE_CODE_MAP[normalized] ?? normalized;
};

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

      const translation = await translate(text, {
        from: translateSource,
        to: translateTarget,
      });

      const responsePayload: TranslateResponseBody = {
        success: true,
        translatedText: translation.text,
        originalText: text,
        sourceLang:
          normalizedSource ??
          mapToAppCode(translation.from.language.iso) ??
          translation.from.language.iso ??
          "auto",
        targetLang: normalizedTarget,
        autoCorrected: translation.from.text.autoCorrected ?? false,
        didYouMean: translation.from.text.didYouMean ?? false,
        pronunciation: translation.from.text.value || undefined,
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
            : "번역 처리 중 오류가 발생했습니다.",
        code,
      });
    }
  }
);

export default translateRouter;
