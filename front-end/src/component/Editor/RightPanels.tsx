import React, { useState, ChangeEvent } from "react";
import PanelTab from "./PanelTab";
import { Editor } from "./Layout";
import "./RightPanels.scss";

const historyItems = [
  "Open Document",
  "Create Snapshot",
  "Adjust Levels",
  "Brush Stroke",
  "Text Tool",
  "Transform Layer",
];

interface RightPanelsProps {
  editor: Editor;
}

const RightPanels: React.FC<RightPanelsProps> = ({ editor }) => {
  const [activeTab, setActiveTab] = useState<
    "layers" | "properties" | "history"
  >("layers");
  const cropLayerItems = editor.pt_cropBoxes ?? [];
  const handleLayerNameChange =
    (layerId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      editor.im_setCropOverlayText(layerId, event.target.value);
    };

  return (
    <aside className="right-panels">
      <div className="panel-tabs">
        <PanelTab
          label="Layers"
          isActive={activeTab === "layers"}
          onClick={() => setActiveTab("layers")}
          icon="bi-layers"
        />
        <PanelTab
          label="Properties"
          isActive={activeTab === "properties"}
          onClick={() => setActiveTab("properties")}
          icon="bi-sliders"
        />
        <PanelTab
          label="History"
          isActive={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          icon="bi-clock-history"
        />
      </div>
      <div className="panel-content">
        {activeTab === "layers" && (
          <div className="panel-stack">
            <div className="panel-section panel-section--list">
              <div className="panel-section__header panel-section--compact">
                <span>Layers</span>
              </div>
              <ul className="layer-list">
                {cropLayerItems.length === 0 ? (
                  <li className="layer-item layer-item--empty">
                    <div className="layer-meta">
                      <span className="layer-name">
                        등록된 Crop Overlay가 없습니다.
                      </span>
                    </div>
                  </li>
                ) : (
                  cropLayerItems.map((layer) => (
                    <li key={layer.id} className="layer-item">
                      <div className="layer-meta">
                        <span className="layer-label">{layer.originText}</span>
                        <input
                          type="text"
                          className="layer-name layer-name-input"
                          value={layer.text ?? ""}
                          onChange={handleLayerNameChange(layer.id)}
                        />
                      </div>
                      <button title="Delete layer">
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "properties" && (
          <div className="panel-stack">
            <div className="panel-section">
              <div className="panel-section__header">
                <span>Transform</span>
              </div>
              <div className="panel-grid">
                <label>
                  <span>Width</span>
                  <input type="number" defaultValue={3000} />
                  <span className="input-suffix">px</span>
                </label>
                <label>
                  <span>Height</span>
                  <input type="number" defaultValue={5400} />
                  <span className="input-suffix">px</span>
                </label>
                <label>
                  <span>X</span>
                  <input type="number" defaultValue={240} />
                  <span className="input-suffix">px</span>
                </label>
                <label>
                  <span>Y</span>
                  <input type="number" defaultValue={180} />
                  <span className="input-suffix">px</span>
                </label>
              </div>
            </div>
            <div className="panel-section">
              <div className="panel-section__header">
                <span>Quick Actions</span>
              </div>
              <div className="panel-actions">
                <button className="panel-actions__button">Auto tone</button>
                <button className="panel-actions__button">Auto color</button>
                <button className="panel-actions__button">Auto contrast</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="panel-stack">
            <div className="panel-section panel-section--compact">
              <div className="panel-section__header">
                <span>History States</span>
                <span className="panel-subtitle">
                  {historyItems.length} steps
                </span>
              </div>
              <ol className="history-list">
                {historyItems.map((item, index) => (
                  <li
                    key={item}
                    className={
                      index === historyItems.length - 2 ? "is-current" : ""
                    }
                  >
                    <span className="history-index">{index + 1}</span>
                    <span className="history-label">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightPanels;
