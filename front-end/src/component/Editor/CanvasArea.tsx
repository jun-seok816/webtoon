import React from "react";

interface CanvasAreaProps {
  zoom: number;
  onZoomChange: (value: number) => void;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ zoom, onZoomChange }) => {
  const clampZoom = (value: number) => Math.min(400, Math.max(10, value));

  const handleZoomChange = (delta: number) => {
    onZoomChange(clampZoom(zoom + delta));
  };

  const handleZoomReset = (value: number) => {
    onZoomChange(clampZoom(value));
  };

  return (
    <section className="canvas-area">
      <div className="canvas-header">
        <div className="document-tabs">
          <button className="document-tab active">
            <span className="document-tab__name">webtoon-editor.psd</span>
            <span className="document-tab__meta">RGB/8 • 3000 x 5400</span>
          </button>
          <button className="document-tab">
            <span className="document-tab__name">character-sketch.psd</span>
            <span className="document-tab__meta">RGB/8 • 2480 x 3508</span>
          </button>
          <button className="document-tab">
            <span className="document-tab__name">logo.ai</span>
            <span className="document-tab__meta">CMYK • 1200 x 630</span>
          </button>
        </div>
        <div className="canvas-header-controls">
          <div className="canvas-zoom">
            <button onClick={() => handleZoomChange(-10)} aria-label="Zoom out">
              <i className="bi bi-dash" aria-hidden="true" />
            </button>
            <span>{zoom}%</span>
            <button onClick={() => handleZoomChange(10)} aria-label="Zoom in">
              <i className="bi bi-plus" aria-hidden="true" />
            </button>
          </div>
          <div className="canvas-view">
            <button onClick={() => handleZoomReset(33)}>Fit</button>
            <button onClick={() => handleZoomReset(66)}>66%</button>
            <button onClick={() => handleZoomReset(100)}>100%</button>
          </div>
        </div>
      </div>

      <div className="canvas-body">
        <div className="canvas-wrapper">
          <div className="canvas-ruler canvas-ruler--horizontal" />
          <div className="canvas-inner">
            <div className="canvas-ruler canvas-ruler--vertical" />
            <div className="canvas-stage">
              <div className="canvas-artboard">
                <div className="artboard-header">
                  <span className="artboard-title">Episode 12 - Page 01</span>
                  <div className="artboard-dimensions">3000 px × 5400 px</div>
                </div>
                <div className="artboard-content">
                  Drop layers or paste artwork to begin editing.
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className="canvas-navigator">
          <div className="navigator-header">
            <span>Navigator</span>
            <button aria-label="Navigator options">
              <i className="bi bi-three-dots" aria-hidden="true" />
            </button>
          </div>
          <div className="navigator-thumbnail">
            <div className="navigator-viewport" />
          </div>
          <div className="navigator-controls">
            <span>{zoom}%</span>
            <div className="navigator-slider">
              <div
                className="navigator-slider__fill"
                style={{ width: `${Math.min(100, zoom)}%` }}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CanvasArea;
