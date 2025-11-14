import React, { useCallback, useMemo, useState } from "react";
import PanelTab from "./PanelTab";
import { Editor } from "./Layout";
import "./RightPanels.scss";
import { SketchPicker } from "react-color";
import type { ColorResult } from "react-color";
import type { EditorColorKey } from "@jsLib/class/ColorPalette";

const layerItems = [
  { id: "layer-3", name: "Speech Bubble", info: "Blend: Screen • 80%", isLocked: false },
  { id: "layer-2", name: "Character Inks", info: "Lock: Transparent", isLocked: true },
  { id: "layer-1", name: "Background Color", info: "Fill 100%", isLocked: true },
];

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
  const [activeTab, setActiveTab] = useState<"layers" | "properties" | "history">("layers");
  const [openPicker, setOpenPicker] = useState<EditorColorKey | null>(null);
  const colorPalette = editor.pt_colorPalette;

  const colorControls = useMemo(
    () => [
      { key: "primary" as EditorColorKey, label: "기본 색상" },
      { key: "secondary" as EditorColorKey, label: "보조 색상" },
    ],
    []
  );

  const togglePicker = useCallback(
    (key: EditorColorKey) => {
      setOpenPicker((previous) => (previous === key ? null : key));
    },
    []
  );

  const applyColor = useCallback(
    (key: EditorColorKey, color: ColorResult, closeAfter: boolean) => {
      colorPalette.im_setColor(key, color.hex);
      if (closeAfter) {
        setOpenPicker(null);
      }
    },
    [colorPalette]
  );

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
            <div className="panel-section panel-section--compact">
              <div className="panel-section__header">
                <span>색상</span>
              </div>
              {colorControls.map(({ key, label }) => {
                const currentColor = colorPalette.pt_getColor(key);
                const isPickerOpen = openPicker === key;
                return (
                  <div className="blend-control" key={key}>
                    <button
                      type="button"
                      className="blend-control__swatch"
                      style={{ backgroundColor: currentColor }}
                      aria-label={`${label} 선택`}
                      onClick={() => togglePicker(key)}
                    />
                    <div className="blend-control__info">
                      <span className="blend-control__label">{label}</span>
                      <span className="blend-control__value">{currentColor}</span>
                    </div>
                    <button
                      type="button"
                      className="blend-control__toggle"
                      onClick={() => togglePicker(key)}
                    >
                      Pick
                    </button>
                    {isPickerOpen && (
                      <div className="blend-control__popover">
                        <SketchPicker
                          color={currentColor}
                          onChange={(color: ColorResult) => applyColor(key, color, false)}
                          onChangeComplete={(color: ColorResult) =>
                            applyColor(key, color, true)
                          }
                          disableAlpha
                        />
                        <button
                          type="button"
                          className="blend-control__close"
                          onClick={() => setOpenPicker(null)}
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="panel-row">
                <label htmlFor="layer-opacity">Opacity</label>
                <input id="layer-opacity" type="number" defaultValue={100} />
                %
              </div>
            </div>

            <div className="panel-section panel-section--list">
              <div className="panel-section__header panel-section--compact">
                <span>Layers</span>
                <div className="panel-icons">
                  <button title="Create new layer">
                    <i className="bi bi-plus-square" aria-hidden="true" />
                  </button>
                  <button title="Create group">
                    <i className="bi bi-folder-plus" aria-hidden="true" />
                  </button>
                  <button title="Delete layer">
                    <i className="bi bi-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <ul className="layer-list">
                {layerItems.map((layer) => (
                  <li key={layer.id} className={`layer-item ${layer.isLocked ? "is-locked" : ""}`}>
                    <div className="layer-thumb" />
                    <div className="layer-meta">
                      <span className="layer-name">{layer.name}</span>
                      <span className="layer-info">{layer.info}</span>
                    </div>
                    {layer.isLocked && (
                      <i className="bi bi-lock-fill layer-lock" aria-hidden="true" />
                    )}
                  </li>
                ))}
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
                <span className="panel-subtitle">{historyItems.length} steps</span>
              </div>
              <ol className="history-list">
                {historyItems.map((item, index) => (
                  <li key={item} className={index === historyItems.length - 2 ? "is-current" : ""}>
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
