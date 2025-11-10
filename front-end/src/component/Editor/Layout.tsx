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
import axios from "axios";
import { useNavigate } from "react-router";

export class Editor extends Main {
  public iv_activeTool = "move";
  private iv_zoom = 100;
  private iv_upload: Upload;
  private iv_loading: Loading;
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
  }

  public get pt_activeTool() {
    return this.iv_activeTool;
  }

  public im_setActiveTool(tool: string) {
    if (this.iv_activeTool === tool) {
      return;
    }
    this.iv_activeTool = tool;
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
}

const Layout: React.FC = () => {
  const [editor] = useState(() => new Editor());
  editor.iv_navigate = useNavigate();
  editor.im_Prepare_Hooks(async () => {
    await editor.pt_loginStore.im_GetSession();
    if(!editor.pt_loginStore.pt_session?.loggedIn){
      editor.im_navigate('/login');
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
