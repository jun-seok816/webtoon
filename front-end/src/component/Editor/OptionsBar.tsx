import React from "react";
import { Editor } from "./Layout";
import "./OptionsBar.scss";

interface OptionsBarProps {
  editor: Editor;
}

const OptionsBar: React.FC<OptionsBarProps> = ({ editor }) => {
  const activeTool = editor.pt_activeTool;
  const originalLang = editor.pt_originalLang;
  const translatedLang = editor.pt_translatedLang;

  const renderToolOptions = () => {
    switch (activeTool) {
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
              <label htmlFor="original-lang">원문 언어</label>
              <select
                id="original-lang"
                value={originalLang}
                onChange={(event) =>
                  editor.im_setOriginalLang(event.target.value)
                }
              >
                <option value="kor">한국어</option>
                <option value="eng">영어</option>
                <option value="jpn">일본어</option>
                <option value="chi_sim">중국어(간체)</option>
              </select>
            </div>
            <div className="options-group">
              <label htmlFor="translated-lang">번역 언어</label>
              <select
                id="translated-lang"
                value={translatedLang}
                onChange={(event) =>
                  editor.im_setTranslatedLang(event.target.value)
                }
              >
                <option value="kor">한국어</option>
                <option value="eng">영어</option>
                <option value="jpn">일본어</option>
                <option value="chi_sim">중국어(간체)</option>
              </select>
            </div>
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
          <i className="bi bi-question-circle" aria-hidden="true" /> Learn
        </button>
      </div>
    </div>
  );
};

export default OptionsBar;
