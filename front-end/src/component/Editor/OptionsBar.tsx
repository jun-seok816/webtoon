import React from "react";

interface OptionsBarProps {
  activeTool: string;
}

const OptionsBar: React.FC<OptionsBarProps> = ({ activeTool }) => {
  const renderToolOptions = () => {
    switch (activeTool) {
      case "brush":
        return (
          <>
            <div className="options-group">
              <label htmlFor="brush-preset">Preset</label>
              <select id="brush-preset" defaultValue="soft-round">
                <option value="soft-round">Soft Round</option>
                <option value="hard-round">Hard Round</option>
                <option value="texture">Texture</option>
              </select>
            </div>
            <div className="options-group">
              <label htmlFor="brush-size">Size</label>
              <input id="brush-size" type="number" defaultValue={32} />
            </div>
            <div className="options-group">
              <label htmlFor="brush-flow">Flow</label>
              <input id="brush-flow" type="number" defaultValue={80} />
            </div>
            <button className="options-button">Smoothing</button>
          </>
        );
      case "text":
        return (
          <>
            <div className="options-group">
              <label htmlFor="font-family">Font</label>
              <select id="font-family" defaultValue="spoqa">
                <option value="spoqa">Spoqa Han Sans</option>
                <option value="inter">Inter</option>
                <option value="noto">Noto Sans KR</option>
              </select>
            </div>
            <div className="options-group">
              <label htmlFor="font-size">Size</label>
              <input id="font-size" type="number" defaultValue={42} />
            </div>
            <div className="options-separator" />
            <button className="options-button">
              <i className="bi bi-type-bold" aria-hidden="true" />
            </button>
            <button className="options-button">
              <i className="bi bi-type-italic" aria-hidden="true" />
            </button>
            <button className="options-button">
              <i className="bi bi-type-strikethrough" aria-hidden="true" />
            </button>
          </>
        );
      case "crop":
        return (
          <>
            <div className="options-group">
              <label htmlFor="crop-ratio">Ratio</label>
              <select id="crop-ratio" defaultValue="original">
                <option value="original">Original Ratio</option>
                <option value="square">1 : 1</option>
                <option value="webtoon">720 x 1280</option>
              </select>
            </div>
            <div className="options-group">
              <label htmlFor="crop-straighten">Straighten</label>
              <input id="crop-straighten" type="number" defaultValue={0} />
            </div>
            <button className="options-button">Reset</button>
            <button className="options-button options-button--primary">
              Apply
            </button>
          </>
        );
      default:
        return (
          <>
            <div className="options-group">
              <label htmlFor="blend-mode">Mode</label>
              <select id="blend-mode" defaultValue="normal">
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
            <div className="options-group">
              <label htmlFor="opacity">Opacity</label>
              <input id="opacity" type="number" defaultValue={100} />
            </div>
            <div className="options-group">
              <label htmlFor="flow">Flow</label>
              <input id="flow" type="number" defaultValue={100} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="options-bar">
      <div className="options-title">{activeTool.toUpperCase()} TOOL</div>
      {renderToolOptions()}
      <div className="options-right">
        <button className="options-button">
          <i className="bi bi-record-circle" aria-hidden="true" /> Actions
        </button>
        <button className="options-button">
          <i className="bi bi-question-circle" aria-hidden="true" /> Learn
        </button>
      </div>
    </div>
  );
};

export default OptionsBar;
