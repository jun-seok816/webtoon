"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const translate_1 = require("@google-cloud/translate");
const translateClient = new translate_1.v2.Translate({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS ??
        path_1.default.resolve(__dirname, "../../webtoon-477201-0f8b97380705.json"),
});
const DEFAULT_TARGET_LANG = "eng";
const LANGUAGE_CODE_MAP = {
    eng: "en",
    kor: "ko",
    jpn: "ja",
    chi_sim: "zh-cn",
};
const mapToTranslateCode = (code) => {
    if (!code) {
        return undefined;
    }
    const normalized = code.trim().toLowerCase();
    return LANGUAGE_CODE_MAP[normalized] ?? normalized;
};
const TRANSLATE_INTERVAL_MS = 1000;
const translateQueue = [];
let isProcessingQueue = false;
let lastInvocationTime = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const performTranslation = async (payload) => {
    const [translation] = await translateClient.translate(payload.text, {
        from: payload.from,
        to: payload.to,
    });
    const translatedText = Array.isArray(translation)
        ? translation[0] ?? ""
        : translation ?? "";
    return {
        translatedText
    };
};
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
                const result = await performTranslation(job.payload);
                lastInvocationTime = Date.now();
                job.resolve(result);
            }
            catch (err) {
                lastInvocationTime = Date.now();
                job.reject(err);
            }
        }
    }
    finally {
        isProcessingQueue = false;
        if (translateQueue.length > 0) {
            processQueue();
        }
    }
};
const enqueueTranslate = (payload) => new Promise((resolve, reject) => {
    translateQueue.push({ payload, resolve, reject });
    void processQueue();
});
const translateRouter = (0, express_1.Router)();
translateRouter.use((req, res, next) => process._myApp.checkSession(req, res, next));
translateRouter.post("/", async (req, res) => {
    try {
        const { text, sourceLang, targetLang } = req.body ?? {};
        if (typeof text !== "string" || text.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "번역할 텍스트를 전달해주세요.",
            });
            return;
        }
        const normalizedTarget = typeof targetLang === "string" && targetLang.trim().length > 0
            ? targetLang.trim()
            : DEFAULT_TARGET_LANG;
        const normalizedSource = typeof sourceLang === "string" && sourceLang.trim().length > 0
            ? sourceLang.trim()
            : undefined;
        const translateTarget = mapToTranslateCode(normalizedTarget) ?? normalizedTarget;
        const translateSource = mapToTranslateCode(normalizedSource) ?? normalizedSource;
        const translation = await enqueueTranslate({
            text,
            from: translateSource,
            to: translateTarget,
        });
        const responsePayload = {
            success: true,
            translatedText: translation.translatedText,
            originalText: text,
            sourceLang: normalizedSource ?? "kor",
            targetLang: normalizedTarget,
        };
        res.json(responsePayload);
    }
    catch (error) {
        console.error("[translate] 번역 처리 실패", error);
        res.status(400).json({
            success: false,
            message: "번역API 호출 실패",
        });
    }
});
exports.default = translateRouter;
//# sourceMappingURL=translateRouter.js.map