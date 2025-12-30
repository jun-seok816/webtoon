import type { AppLanguageCode } from "./translate";
export interface OcrRequestBody {
    image: string;
    language: AppLanguageCode;
    batchId: number;
}
export interface OcrWordBoundingBox {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}
export interface OcrWord {
    text: string;
    confidence: number;
    bbox: OcrWordBoundingBox;
}
export interface OcrSuccessResponse {
    success: true;
    text: string;
    confidence: number | null;
    words: OcrWord[];
}
export interface OcrFailureResponse {
    success: false;
    message: string;
}
export type OcrResponseBody = OcrSuccessResponse | OcrFailureResponse;
//# sourceMappingURL=ocr.d.ts.map