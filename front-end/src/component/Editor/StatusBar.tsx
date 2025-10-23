import React from "react";

interface StatusBarProps {
  zoom: number;
  activeTool: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ zoom, activeTool }) => {
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
        {activeTool.toUpperCase()}
      </div>
      <div className="status-section">
        <span className="status-label">Zoom</span>
        {zoom}%
      </div>
    </div>
  );
};

export default StatusBar;
