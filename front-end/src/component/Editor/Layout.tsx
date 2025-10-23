import React, { useState } from "react";
import MenuBar from "./MenuBar";
import ToolsPanel from "./ToolsPanel";
import OptionsBar from "./OptionsBar";
import CanvasArea from "./CanvasArea";
import RightPanels from "./RightPanels";
import TitleBar from "./TitleBar";
import StatusBar from "./StatusBar";
import "./App.scss";

const Layout: React.FC = () => {
  const [activeTool, setActiveTool] = useState("move");
  const [zoom, setZoom] = useState(66);

  return (
    <div className="app-layout">
      <TitleBar documentName="webtoon-editor.psd" zoom={zoom} />
      <MenuBar />
      <OptionsBar activeTool={activeTool} />
      <ToolsPanel activeTool={activeTool} onSelectTool={setActiveTool} />
      <CanvasArea zoom={zoom} onZoomChange={setZoom} />
      <RightPanels />
      <StatusBar activeTool={activeTool} zoom={zoom} />
    </div>
  );
};

export default Layout;
