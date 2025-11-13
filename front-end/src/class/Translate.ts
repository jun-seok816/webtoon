import axios, { AxiosInstance } from "axios";
import type {
  TranslateRequestBody,
  TranslateResponseBody,
  TranslateSuccessResponse,
} from "@shared/types/translate";

interface TranslateClientOptions {
  baseURL?: string;
  withCredentials?: boolean;
}

export class TranslateClient {
  private readonly iv_forceRender?: () => void;
  private readonly iv_client: AxiosInstance;
  private iv_lastRequest: TranslateRequestBody | null = null;
  private iv_lastResponse: TranslateResponseBody | null = null;
  private iv_isLoading = false;
  private iv_error: string | null = null;

  constructor(forceRender?: () => void, options?: TranslateClientOptions) {
    this.iv_forceRender = forceRender;
    this.iv_client = axios.create({
      baseURL: options?.baseURL ?? "/api/translate",
      withCredentials: options?.withCredentials ?? true,
    });
  }

  public get pt_lastRequest() {
    return this.iv_lastRequest;
  }

  public get pt_lastResponse() {
    return this.iv_lastResponse;
  }

  public get pt_isLoading() {
    return this.iv_isLoading;
  }

  public get pt_error() {
    return this.iv_error;
  }

  public im_SetLastRequest(payload: TranslateRequestBody) {
    this.iv_lastRequest = payload;
    this.iv_forceRender?.();
  }

  public im_ClearResponse() {
    this.iv_lastResponse = null;
    this.iv_error = null;
    this.iv_forceRender?.();
  }

  public async im_Translate(payload?: TranslateRequestBody) {
    const body = payload ?? this.iv_lastRequest;
    if (!body) {
      throw new Error("번역 요청 정보를 먼저 설정해주세요.");
    }

    this.iv_isLoading = true;
    this.iv_error = null;
    this.iv_forceRender?.();

    try {
      const { data } = await this.iv_client.post<TranslateResponseBody>("/", body);
      this.iv_lastRequest = body;
      this.iv_lastResponse = data;
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const fallback =
          (error.response?.data as TranslateResponseBody | undefined) ?? null;
        this.iv_lastResponse = fallback;
        this.iv_error =
          (fallback && !fallback.success && fallback.message) ||
          error.message ||
          "번역 요청에 실패했습니다.";
      } else if (error instanceof Error) {
        this.iv_error = error.message;
        this.iv_lastResponse = null;
      } else {
        this.iv_error = "알 수 없는 오류가 발생했습니다.";
        this.iv_lastResponse = null;
      }
      throw error;
    } finally {
      this.iv_isLoading = false;
      this.iv_forceRender?.();
    }
  }

  public get pt_TranslatedText(): string {
    if (this.iv_lastResponse?.success) {
      return this.iv_lastResponse.translatedText;
    }
    return "";
  }

  public get pt_ResponseMeta(): TranslateSuccessResponse | null {
    if (this.iv_lastResponse?.success) {
      return this.iv_lastResponse;
    }
    return null;
  }
}
