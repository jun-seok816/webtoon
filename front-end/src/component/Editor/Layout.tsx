import React, { useState } from "react";
import MenuBar from "./MenuBar";
import ToolsPanel from "./ToolsPanel";
import OptionsBar from "./OptionsBar";
import CanvasArea from "./CanvasArea";
import RightPanels from "./RightPanels";
import TitleBar from "./TitleBar";
import StatusBar from "./StatusBar";
import "./EditorBase.scss";
import "./Layout.scss";
import { Main } from "@jsLib/class/Main_class";
import { Upload } from "@jsLib/class/Upload";
import { Loading } from "@jsLib/class/Loading";
import { LoginModalState } from "@jsLib/class/Login";

export class Editor extends Main {
  public iv_activeTool = "move";
  private iv_zoom = 100;
  private iv_upload: Upload;
  private iv_loading: Loading;
  private iv_loginStore: LoginModalState;
  public iv_isFileModalOpen = false;
  public iv_selectedFiles: File[] = [];
  public iv_isUploading = false;
  public iv_uploadTitle = "";

  constructor() {
    super();
    this.iv_upload = new Upload(() => {
      this.im_forceRender();
    });
    this.iv_loading = new Loading(
      () => {
        this.im_forceRender();
      },
      "editor"
    );
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

  public get pt_selectedFiles() {
    return this.iv_selectedFiles;
  }

  public get pt_isUploading() {
    return this.iv_isUploading;
  }

  public get pt_uploadTitle() {
    return this.iv_uploadTitle;
  }
}

const Layout: React.FC = () => {
  const [editor] = useState(() => new Editor());

  editor.im_Prepare_Hooks(() => {});

  return (
    <div className="app-layout">
      <TitleBar editor={editor} />
      <MenuBar editor={editor} />
      <OptionsBar editor={editor} />
      <ToolsPanel editor={editor} />
      <CanvasArea editor={editor} />
      <RightPanels editor={editor} />
      <StatusBar editor={editor} />
    </div>
  );
};

export default Layout;
