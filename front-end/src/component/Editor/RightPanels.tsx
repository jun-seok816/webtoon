import React, { ChangeEvent, useCallback } from "react";
import { Editor } from "./Layout";
import "./RightPanels.scss";

interface RightPanelsProps {
  editor: Editor;
}

const RightPanels: React.FC<RightPanelsProps> = ({ editor }) => {
  const cropStore = editor.crops;
  const cropLayerItems = cropStore.boxes ?? [];
  const scrollOverlayIntoView = useCallback((overlayId: string) => {
    const safeOverlayId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(overlayId)
        : overlayId.replace(/(["\\])/g, "\\$1");
    const overlayElement = document.querySelector<HTMLElement>(
      `.crop-overlay[data-overlay-id="${safeOverlayId}"]`
    );
    if (!overlayElement) {
      return;
    }

    const viewport =
      (overlayElement.closest(
        ".scroll-viewer__viewport"
      ) as HTMLElement | null) ??
      document.querySelector<HTMLElement>(".scroll-viewer__viewport");
    if (!viewport) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const overlayRect = overlayElement.getBoundingClientRect();
    const overlayTop = overlayRect.top - viewportRect.top + viewport.scrollTop;
    const overlayBottom = overlayTop + overlayRect.height;
    const visibleTop = viewport.scrollTop;
    const visibleBottom = visibleTop + viewport.clientHeight;

    if (overlayTop < visibleTop || overlayBottom > visibleBottom) {
      const centerTop =
        overlayTop - viewport.clientHeight / 2 + overlayRect.height / 2;

      viewport.scrollTo({
        top: centerTop,
        behavior: "smooth",
      });
    }
  }, []);
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
                      <span className="layer-name">Crop Overlay</span>
                    </div>
                  </li>
                ) : (
                  cropLayerItems.map((layer) => (
                    <li
                      key={layer.id}
                      className="layer-item"
                      style={layer.id === cropStore.selectBox?.id?{"borderBottom":"1px solid white"}:{}}
                      onClick={() => scrollOverlayIntoView(layer.id)}
                    >
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
                        onClick={(event) => {
                          event.stopPropagation();
                          cropStore.removeOverlay(layer.id);
                        }}
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
