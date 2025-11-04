import React from "react";
import { Editor } from "./Layout";
import "./ToolsPanel.scss";

interface ToolsPanelProps {
  editor: Editor;
}

const tools = [
  { id: "crop", icon: "bi-crop", label: "Crop Tool (C)" },
  { id: "eraser", icon: "bi-eraser", label: "Eraser Tool (E)" },
  { id: "text", icon: "bi-type", label: "Text Tool (T)" },
];

const ToolsPanel: React.FC<ToolsPanelProps> = ({ editor }) => {
  const activeTool = editor.pt_activeTool;

  return (
    <div className="tools-panel">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${activeTool === tool.id ? "active" : ""}`}
          onClick={() => editor.im_setActiveTool(tool.id)}
          title={tool.label}
        >
          <i className={`bi ${tool.icon}`} aria-hidden="true" />
        </button>
      ))}
      <div className="tool-divider" />
    </div>
  );
};

export default ToolsPanel;
