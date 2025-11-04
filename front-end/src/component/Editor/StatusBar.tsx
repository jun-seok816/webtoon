import React from "react";
import { Editor } from "./Layout";
import "./StatusBar.scss";

interface StatusBarProps {
  editor: Editor;
}

const StatusBar: React.FC<StatusBarProps> = ({ editor }) => {
  return (
    <div className="status-bar">
      <div className="status-section">
        <span className="status-label">Doc</span>
        webtoon-editor.psd
      </div>
      <div className="status-section">
        <span className="status-label">Profile</span>
        RGB / 8
      </div>
      <div className="status-section status-section--stretch">
        <span className="status-label">Hints</span>
        Use spacebar to pan the canvas. Hold Alt to sample colors.
      </div>
      <div className="status-section">
        <span className="status-label">Tool</span>
        {editor.pt_activeTool.toUpperCase()}
      </div>      
    </div>
  );
};

export default StatusBar;
