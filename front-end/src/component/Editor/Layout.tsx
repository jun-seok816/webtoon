import React from 'react';
import MenuBar from './MenuBar';
import ToolsPanel from './ToolsPanel';
import OptionsBar from './OptionsBar';
import CanvasArea from './CanvasArea';
import RightPanels from './RightPanels';
import "./App.scss";

const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      <MenuBar />
      <OptionsBar />
      <ToolsPanel />
      <CanvasArea />
      <RightPanels />
    </div>
  );
};

export default Layout;