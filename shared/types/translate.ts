export type AppLanguageCode = "eng" | "kor" | "jpn" | "chi_sim";
export type TranslateLanguageCode = AppLanguageCode | string;

export interface TranslateRequestBody {
  text: string;
  sourceLang: AppLanguageCode;
  targetLang: AppLanguageCode;
}

export interface TranslateSuccessResponse {
  success: true;
  translatedText: string;
  originalText: string;
  sourceLang: TranslateLanguageCode;
  targetLang: TranslateLanguageCode;
}

export interface TranslateErrorResponse {
  success: false;
  message: string;
  code?: string;
}

export type TranslateResponseBody =
  | TranslateSuccessResponse
  | TranslateErrorResponse;
