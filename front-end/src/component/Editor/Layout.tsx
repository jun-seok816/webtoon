import React, { useState } from "react";
import MenuBar from "./MenuBar";
import ToolsPanel from "./ToolsPanel";
import OptionsBar from "./OptionsBar";
import CanvasArea from "./CanvasArea";
import RightPanels from "./RightPanels";
import TitleBar from "./TitleBar";
import "./EditorBase.scss";
import "./Layout.scss";
import { Main } from "@jsLib/class/Main_class";
import { Upload } from "@jsLib/class/Upload";
import { Loading } from "@jsLib/class/Loading";
import { LoginModalState } from "@jsLib/class/Login";
import type { UploadBatchDto, UploadListResponseDto } from "@shared/types/uploads";
import type { AppLanguageCode } from "@shared/types/translate";
import axios from "axios";
import { useNavigate } from "react-router";
import { OcrClient } from "@jsLib/class/OcrClient";
import { TranslateClient } from "@jsLib/class/Translate";
import { ColorPalette } from "@jsLib/class/ColorPalette";
import type { CropOverlayBox } from "./CropOverlayTypes";

export class Editor extends Main {
  public iv_activeTool = "crop";
  private iv_originalLang: AppLanguageCode = "kor";
  private iv_translatedLang: AppLanguageCode = "eng";
  private iv_zoom = 100;
  private readonly iv_upload: Upload;
  private readonly iv_loading: Loading;
  private readonly iv_OcrClient:OcrClient;
  private readonly iv_Translate:TranslateClient;
  private readonly iv_colorPalette: ColorPalette;
  private iv_cropBoxes: CropOverlayBox[] = [];
  private iv_cropHistory: CropOverlayBox[][] = [];
  private iv_cropHistoryIndex = 0;
  private readonly iv_cropHistoryLimit = 50;
  private iv_cropOpacity = 100;
  private iv_loginStore: LoginModalState;
  public iv_isFileModalOpen = false;
  public iv_isUploadHistoryOpen = false;
  public iv_selectedFiles: File[] = [];
  public iv_isUploading = false;
  public iv_uploadTitle = "";
  public iv_selectedUploadBatch: UploadBatchDto | null = null;
  public iv_uploadBatchDto: UploadBatchDto[] = [];
  public iv_testUploadBatchDto: UploadBatchDto[] = [];

  constructor() {
    super();
    this.iv_upload = new Upload(() => {
      this.im_forceRender();
    });
    this.iv_loading = new Loading(() => {
      this.im_forceRender();
    }, "editor");
    this.iv_loginStore = new LoginModalState(() => {
      this.im_forceRender();
    });
    this.iv_OcrClient = new OcrClient(()=>{
      this.im_forceRender();
    })
    this.iv_Translate = new TranslateClient(()=>{
      this.im_forceRender();
    })
    this.iv_colorPalette = new ColorPalette(() => {
      this.im_forceRender();
    });
    this.im_initializeCropHistory();
  }

  public get pt_activeTool() {
    return this.iv_activeTool;
  }

  public get pt_originalLang() {
    return this.iv_originalLang;
  }

  public get pt_translatedLang() {
    return this.iv_translatedLang;
  }  

  public im_setActiveTool(tool: string) {
    if (this.iv_activeTool === tool) {
      return;
    }
    this.iv_activeTool = tool;
    this.im_forceRender();
  }

  public im_setOriginalLang(language: AppLanguageCode) {
    if (this.iv_originalLang === language) {
      return;
    }
    this.iv_originalLang = language;
    this.im_forceRender();
  }

  public im_setTranslatedLang(language: AppLanguageCode) {
    if (this.iv_translatedLang === language) {
      return;
    }
    this.iv_translatedLang = language;
    this.im_forceRender();
  }

  public get pt_zoom() {
    return this.iv_zoom;
  }

  public im_setZoom(nextZoom: number) {
    const clampedZoom = Math.max(10, Math.min(400, Math.round(nextZoom)));
    if (this.iv_zoom === clampedZoom) {
      return;
    }
    this.iv_zoom = clampedZoom;
    this.im_forceRender();
  }

  public get pt_upload() {
    return this.iv_upload;
  }

  public get pt_loading() {
    return this.iv_loading;
  }

  public get pt_ocrClient(){
    return this.iv_OcrClient;
  }

  public get pt_loginStore() {
    return this.iv_loginStore;
  }

  public get pt_isFileModalOpen() {
    return this.iv_isFileModalOpen;
  }

  public get pt_isUploadHistoryOpen() {
    return this.iv_isUploadHistoryOpen;
  }

  public get pt_selectedFiles() {
    return this.iv_selectedFiles;
  }

  public get pt_isUploading() {
    return this.iv_isUploading;
  }

  public get pt_uploadTitle() {
    return this.iv_uploadTitle;
  }

  public get pt_selectedUploadBatch() {
    return this.iv_selectedUploadBatch;
  }

  public get pt_translateClient(){
    return this.iv_Translate;
  }

  public get pt_colorPalette() {
    return this.iv_colorPalette;
  }

  public get pt_cropBoxes() {
    return this.iv_cropBoxes;
  }

  public get pt_canUndoCropHistory() {
    return this.iv_cropHistoryIndex > 0;
  }

  public get pt_canRedoCropHistory() {
    return this.iv_cropHistoryIndex < this.iv_cropHistory.length - 1;
  }

  public get pt_cropOpacity() {
    return this.iv_cropOpacity;
  }

  public im_addCropOverlay(box: CropOverlayBox) {
    const normalizedOverlay: CropOverlayBox = {
      ...box,
      opacity: this.im_normalizeCropOpacity(box.opacity),
    };
    this.im_commitCropBoxes([...this.iv_cropBoxes, normalizedOverlay],{recordHistory:false});
  }

  public im_setCropOpacity(nextOpacity: number) {
    const clamped = this.im_normalizeCropOpacity(nextOpacity, 0);
    if (this.iv_cropOpacity === clamped) {
      return;
    }
    this.iv_cropOpacity = clamped;
    this.im_forceRender();
  }

  public im_setCropOverlayText(id: string, text: string) {
    let updated = false;
    const nextBoxes = this.iv_cropBoxes.map((box) => {
      if (box.id === id) {
        updated = true;
        return { ...box, text };
      }
      return box;
    });
    if (updated) {
      this.im_commitCropBoxes(nextBoxes);
    }
  }

  public im_removeCropOverlay(id: string) {
    const nextBoxes = this.iv_cropBoxes.filter((box) => box.id !== id);
    if (nextBoxes.length === this.iv_cropBoxes.length) {
      return;
    }
    this.im_commitCropBoxes(nextBoxes);
  }

  private im_normalizeCropOpacity(value?: number, fallback?: number) {
    const base = typeof fallback === "number" ? fallback : this.iv_cropOpacity;
    const numeric =
      typeof value === "number" && Number.isFinite(value) ? value : base;
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  public im_clearCropOverlays(
    options: { skipHistory?: boolean; resetHistory?: boolean } = {}
  ) {
    const skipHistory = options.skipHistory ?? false;
    const resetHistory = options.resetHistory ?? false;
    if (this.iv_cropBoxes.length === 0 && !resetHistory) {
      return;
    }
    this.im_commitCropBoxes([], { recordHistory: !skipHistory });
    if (resetHistory) {
      this.im_initializeCropHistory();
    }
  }

  public im_undoCropOverlays() {
    if (!this.pt_canUndoCropHistory) {
      return;
    }
    this.iv_cropHistoryIndex -= 1;
    const snapshot =
      this.iv_cropHistory[this.iv_cropHistoryIndex] ?? [];
    this.im_commitCropBoxes(this.im_cloneCropBoxes(snapshot), {
      recordHistory: false,
    });
  }

  public im_redoCropOverlays() {
    if (!this.pt_canRedoCropHistory) {
      return;
    }
    this.iv_cropHistoryIndex += 1;
    const snapshot =
      this.iv_cropHistory[this.iv_cropHistoryIndex] ?? [];
    this.im_commitCropBoxes(this.im_cloneCropBoxes(snapshot), {
      recordHistory: false,
    });
  }

  public im_setSelectedUploadBatch(batch: UploadBatchDto | null) {
    if (this.iv_selectedUploadBatch === batch) {
      return;
    }
    this.iv_selectedUploadBatch = batch;
    this.im_forceRender();
  }

  public async im_loadHistory(mode: "user" | "test" = "user") {
    const endpoint = mode === "test" ? "/api/uploads/test" : "/api/uploads";
    const { data } = await axios.get<UploadListResponseDto>(endpoint);
    if (data.success) {
      if (mode === "test") {
        this.iv_testUploadBatchDto = data.batches;
      } else {
        this.iv_uploadBatchDto = data.batches;
      }
    } else {
      const fallback =
        mode === "test"
          ? "테스트 배치를 불러오지 못했습니다."
          : "업로드 내역을 불러오지 못했습니다.";
      Main.im_toast(data.message ?? fallback, "error");
    }
    return data;
  }

  public im_reorderSelectedUploadItems(
    sourceIndex: number,
    destinationIndex: number
  ) {
    if (!this.iv_selectedUploadBatch) {
      return;
    }

    const items = this.iv_selectedUploadBatch.items;
    const maxIndex = items.length - 1;
    if (
      sourceIndex === destinationIndex ||
      sourceIndex < 0 ||
      destinationIndex < 0 ||
      sourceIndex > maxIndex ||
      destinationIndex > maxIndex
    ) {
      return;
    }

    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(sourceIndex, 1);
    updatedItems.splice(destinationIndex, 0, movedItem);

    this.iv_selectedUploadBatch = {
      ...this.iv_selectedUploadBatch,
      items: updatedItems,
    };

    this.im_forceRender();
  }

  private im_cloneCropBoxes(
    boxes: CropOverlayBox[]
  ): CropOverlayBox[] {
    return boxes.map((box) => ({ ...box }));
  }

  private im_initializeCropHistory() {
    this.iv_cropHistory = [this.im_cloneCropBoxes(this.iv_cropBoxes)];
    this.iv_cropHistoryIndex = 0;
  }

  private im_pushCropHistorySnapshot(boxes: CropOverlayBox[]) {
    const historyUpToCurrent = this.iv_cropHistory.slice(
      0,
      this.iv_cropHistoryIndex + 1
    );
    historyUpToCurrent.push(this.im_cloneCropBoxes(boxes));
    const overflow = historyUpToCurrent.length - this.iv_cropHistoryLimit;
    if (overflow > 0) {
      historyUpToCurrent.splice(0, overflow);
    }
    this.iv_cropHistory = historyUpToCurrent;
    this.iv_cropHistoryIndex = this.iv_cropHistory.length - 1;
  }

  private im_commitCropBoxes(
    nextBoxes: CropOverlayBox[],
    options: { recordHistory?: boolean } = {}
  ) {
    const recordHistory = options.recordHistory ?? true;
    this.iv_cropBoxes = nextBoxes;
    if (recordHistory) {
      this.im_pushCropHistorySnapshot(nextBoxes);
    }
    this.im_forceRender();
  }
}

const Layout: React.FC = () => {
  const [editor] = useState(() => new Editor());
  editor.iv_navigate = useNavigate();
  editor.im_Prepare_Hooks(async () => {
    await editor.pt_loginStore.im_GetSession();
    if(!editor.pt_loginStore.pt_session?.loggedIn){
      editor.im_navigate('/login');
    }else{
      editor.iv_isUploadHistoryOpen = true;
      editor.im_forceRender();
    }
  });

  return (
    <div className="app-layout">
      <TitleBar editor={editor} />
      <MenuBar editor={editor} />
      <OptionsBar editor={editor} />
      <ToolsPanel editor={editor} />
      <CanvasArea editor={editor} />
      <RightPanels editor={editor} />      
    </div>
  );
};

export default Layout;
