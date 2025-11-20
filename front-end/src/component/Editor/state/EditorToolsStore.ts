import type { AppLanguageCode } from "@shared/types/translate";

type Notify = () => void;

export class EditorToolsStore {
  private activeToolValue = "crop";
  private originalLanguage: AppLanguageCode = "kor";
  private translatedLanguage: AppLanguageCode = "eng";
  private zoomValue = 100;

  constructor(private readonly notify: Notify) {}

  public get activeTool() {
    return this.activeToolValue;
  }

  public setActiveTool(tool: string) {
    if (this.activeToolValue === tool) {
      return;
    }
    this.activeToolValue = tool;
    this.notify();
  }

  public get originalLang() {
    return this.originalLanguage;
  }

  public setOriginalLang(language: AppLanguageCode) {
    if (this.originalLanguage === language) {
      return;
    }
    this.originalLanguage = language;
    this.notify();
  }

  public get translatedLang() {
    return this.translatedLanguage;
  }

  public setTranslatedLang(language: AppLanguageCode) {
    if (this.translatedLanguage === language) {
      return;
    }
    this.translatedLanguage = language;
    this.notify();
  }

  public get zoom() {
    return this.zoomValue;
  }

  public setZoom(nextZoom: number) {
    const clampedZoom = Math.max(10, Math.min(400, Math.round(nextZoom)));
    if (this.zoomValue === clampedZoom) {
      return;
    }
    this.zoomValue = clampedZoom;
    this.notify();
  }
}
