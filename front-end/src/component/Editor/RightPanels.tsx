import React, { ChangeEvent } from "react";
import { Editor } from "./Layout";
import "./RightPanels.scss";

interface RightPanelsProps {
  editor: Editor;
}

const RightPanels: React.FC<RightPanelsProps> = ({ editor }) => {
  const cropStore = editor.crops;
  const cropLayerItems = cropStore.boxes ?? [];
  const handleLayerNameChange =
    (layerId: string) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      cropStore.setOverlayText(layerId, event.target.value);
    };

  return (
    <aside className="right-panels">
      <div className="panel-content">
        <div className="panel-stack">
          <div className="panel-section panel-section--list">
            <div className="layer-list__scroll">
              <ul className="layer-list">
                {cropLayerItems.length === 0 ? (
                  <li className="layer-item layer-item--empty">
                    <div className="layer-meta">
                      <span className="layer-name">
                        ??록??Crop Overlay가 ??습??다.
                      </span>
                    </div>
                  </li>
                ) : (
                  cropLayerItems.map((layer) => (
                    <li key={layer.id} className="layer-item">
                      <div className="layer-meta">
                        <span className="layer-label">{layer.originText}</span>
                        <textarea
                          className="layer-name layer-name-input"
                          value={layer.text ?? ""}
                          onChange={handleLayerNameChange(layer.id)}
                          rows={Math.max(
                            1,
                            (layer.text?.split(/\r\n|\r|\n/) ?? [""]).length
                          )}
                        />
                      </div>
                      <button
                        onClick={() => cropStore.removeOverlay(layer.id)}
                        title="Delete layer"
                      >
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightPanels;
