import React, { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { Editor } from "./Layout";
import "./OptionsBar.scss";
import { AppLanguageCode } from "@shared/types/translate";
import { SketchPicker } from "react-color";
import type { ColorResult } from "react-color";
import type { EditorColorKey } from "@jsLib/class/ColorPalette";

interface OptionsBarProps {
  editor: Editor;
}

const OptionsBar: React.FC<OptionsBarProps> = ({ editor }) => {
  const activeTool = editor.pt_activeTool;
  const originalLang = editor.pt_originalLang;
  const translatedLang = editor.pt_translatedLang;
  const colorPalette = editor.pt_colorPalette;
  const [openPicker, setOpenPicker] = useState<EditorColorKey | null>(null);
  const [cropOpacityInput, setCropOpacityInput] = useState(() =>
    editor.pt_cropOpacity.toString()
  );

  const colorControls = useMemo(
    () => [
      { key: "primary" as EditorColorKey, label: "배경 색상" },
      { key: "secondary" as EditorColorKey, label: "텍스트 색상" },
    ],
    []
  );

  useEffect(() => {
    setCropOpacityInput(editor.pt_cropOpacity.toString());
  }, [editor.pt_cropOpacity]);

  const togglePicker = useCallback((key: EditorColorKey) => {
    setOpenPicker((previous) => (previous === key ? null : key));
  }, []);

  const applyCropOpacityValue = useCallback(
    (value: string) => {
      if (value.trim() === "") {
        editor.im_setCropOpacity(0);
        return;
      }
      const numeric = Number(value);
      editor.im_setCropOpacity(Number.isFinite(numeric) ? numeric : 0);
    },
    [editor]
  );

  const debouncedCropOpacityUpdate = useMemo(
    () => debounce(applyCropOpacityValue, 200),
    [applyCropOpacityValue]
  );

  useEffect(() => {
    return () => debouncedCropOpacityUpdate.cancel();
  }, [debouncedCropOpacityUpdate]);

  const handleCropOpacityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setCropOpacityInput(nextValue);
      debouncedCropOpacityUpdate(nextValue);
    },
    [debouncedCropOpacityUpdate]
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
                  editor.im_setOriginalLang(event.target.value as AppLanguageCode)
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
                  editor.im_setTranslatedLang(event.target.value as AppLanguageCode)
                }
              >
                <option value="kor">한국어</option>
                <option value="eng">영어</option>
                <option value="jpn">일본어</option>
                <option value="chi_sim">중국어(간체)</option>
              </select>
            </div>
            <div className="options-color-controls">
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
            </div>
            <div className="options-group options-group--small">
              <label htmlFor="crop-opacity">Opacity</label>
              <input
                id="crop-opacity"
                type="number"
                min={0}
                max={100}
                value={cropOpacityInput}
                onChange={handleCropOpacityChange}
              />
            </div>
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
