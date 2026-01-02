import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
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
import { useNavigate } from "react-router";
import { OcrClient } from "@jsLib/class/OcrClient";
import { TranslateClient } from "@jsLib/class/Translate";
import { ColorPalette } from "@jsLib/class/ColorPalette";
import { EditorToolsStore } from "./state/EditorToolsStore";
import { EditorCropStore } from "./state/EditorCropStore";
import { EditorUiStore } from "./state/EditorUiStore";
import { EditorUploadHistoryStore } from "./state/EditorUploadHistoryStore";
import { RoboFlow } from "@jsLib/class/RoboFlow";
import type { UploadBatchDto } from "@shared/types/uploads";
import type { GetCropOverlaysResponse } from "@shared/types/editorCrops";

export class Editor extends Main {
  public readonly upload: Upload;
  public readonly loading: Loading;
  public readonly loginStore: LoginModalState;
  public readonly ocrClient: OcrClient;
  public readonly roboFlow: RoboFlow;
  public readonly translateClient: TranslateClient;
  public readonly colorPalette: ColorPalette;
  public readonly tools: EditorToolsStore;
  public readonly crops: EditorCropStore;
  public readonly ui: EditorUiStore;
  public readonly uploadHistory: EditorUploadHistoryStore;

  constructor() {
    super();
    const notify = () => {
      this.im_forceRender();
    };
    this.upload = new Upload(notify);
    this.loading = new Loading(notify, "editor");
    this.roboFlow = new RoboFlow(notify);
    this.loginStore = new LoginModalState(notify);
    this.ocrClient = new OcrClient(notify);
    this.translateClient = new TranslateClient(notify);
    this.colorPalette = new ColorPalette(notify);
    this.tools = new EditorToolsStore(notify);
    this.crops = new EditorCropStore(notify);
    this.ui = new EditorUiStore(notify);
    this.uploadHistory = new EditorUploadHistoryStore(notify);
  }

  public async selectUploadBatch(
    batch: UploadBatchDto,
    options?: { onClose?: () => void }
  ) {
    options?.onClose?.();
    this.uploadHistory.setCurrentBatch(batch);
    await this.loadBatchOverlays(batch);
  }

  public async handleBatchKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    batch: UploadBatchDto,
    options?: { onClose?: () => void }
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    await this.selectUploadBatch(batch, options);
  }

  private async loadBatchOverlays(batch: UploadBatchDto) {
    try {
      const { data: overlaysData } = await axios.get<GetCropOverlaysResponse>(
        `/api/editor/crops/${batch.id}`
      );
      if (overlaysData.success) {
        this.crops.clear({ skipHistory: true, resetHistory: true });
        this.crops.initOverlay(overlaysData.overlays);
      }
    } catch (overlayError) {
      console.error("[UploadHistory] overlay 불러오기 실패", overlayError);
    }
  }
}

const Layout: React.FC = () => {
  const [editor] = useState(() => new Editor());
  editor.iv_navigate = useNavigate();
  editor.im_Prepare_Hooks(async () => {
    await editor.loginStore.im_GetSession();
    if (!editor.loginStore.pt_session?.loggedIn) {
      editor.im_navigate("/login");
    } else {
      editor.ui.openUploadHistory();
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
