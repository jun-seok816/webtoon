declare module "google-translate-api" {
  export interface TranslateOptions {
    from?: string;
    to?: string;
    raw?: boolean;
  }

  export interface TranslateResult {
    text: string;
    from: {
      language: {
        didYouMean: boolean;
        iso: string;
      };
      text: {
        autoCorrected: boolean;
        value: string;
        didYouMean: boolean;
      };
    };
    raw?: string;
  }

  export interface LanguagesHelper {
    [language: string]: string | ((lang: string) => string | boolean);
    isSupported(lang: string): boolean;
    getCode(lang: string): string;
  }

  export default function translate(
    text: string,
    options?: TranslateOptions
  ): Promise<TranslateResult>;

  export const languages: LanguagesHelper;
}
