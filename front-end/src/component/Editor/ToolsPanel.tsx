import React from "react";

interface ToolsPanelProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
}

const tools = [
  { id: "move", icon: "bi-arrows-move", label: "Move Tool (V)" },
  { id: "marquee", icon: "bi-bounding-box-circles", label: "Marquee Tool (M)" },
  { id: "lasso", icon: "bi-bezier", label: "Lasso Tool (L)" },
  { id: "crop", icon: "bi-crop", label: "Crop Tool (C)" },
  { id: "brush", icon: "bi-brush", label: "Brush Tool (B)" },
  { id: "eraser", icon: "bi-eraser", label: "Eraser Tool (E)" },
  { id: "gradient", icon: "bi-droplet-half", label: "Gradient Tool (G)" },
  { id: "text", icon: "bi-type", label: "Text Tool (T)" },
  { id: "shape", icon: "bi-shapes", label: "Shape Tool (U)" },
  { id: "hand", icon: "bi-hand-index-thumb", label: "Hand Tool (H)" },
  { id: "zoom", icon: "bi-zoom-in", label: "Zoom Tool (Z)" },
];

const ToolsPanel: React.FC<ToolsPanelProps> = ({ activeTool, onSelectTool }) => {
  return (
    <div className="tools-panel">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${activeTool === tool.id ? "active" : ""}`}
          onClick={() => onSelectTool(tool.id)}
          title={tool.label}
        >
          <i className={`bi ${tool.icon}`} aria-hidden="true" />
        </button>
      ))}
      <div className="tool-divider" />
      <button
        className="tool-button"
        title="Foreground / Background Colors (D)"
      >
        <span className="swatch-stack">
          <span className="swatch swatch--primary" />
          <span className="swatch swatch--secondary" />
        </span>
      </button>
    </div>
  );
};

export default ToolsPanel;
