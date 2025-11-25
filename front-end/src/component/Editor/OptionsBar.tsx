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
  const toolStore = editor.tools;
  const cropStore = editor.crops;
  const colorPalette = editor.colorPalette;
  const activeTool = toolStore.activeTool;
  const originalLang = toolStore.originalLang;
  const translatedLang = toolStore.translatedLang;
  const canUndo = cropStore.canUndo;
  const canRedo = cropStore.canRedo;
  const [openPicker, setOpenPicker] = useState<EditorColorKey | null>(null);
  const cropOpacity = toolStore.opacity;
  const [cropOpacityInput, setCropOpacityInput] = useState(() =>
    cropOpacity.toString()
  );

  const colorControls = useMemo(
    () => [
      { key: "primary" as EditorColorKey, label: "배경 색상" },
      { key: "secondary" as EditorColorKey, label: "텍스트 색상" },
    ],
    []
  );

  useEffect(() => {
    setCropOpacityInput(cropOpacity.toString());
  }, [cropOpacity]);

  const togglePicker = useCallback((key: EditorColorKey) => {
    setOpenPicker((previous) => (previous === key ? null : key));
  }, []);

  const applyCropOpacityValue = useCallback(
    (value: string) => {
      if (value.trim() === "") {
        toolStore.setOpacity(0);
        return;
      }
      const numeric = Number(value);
      toolStore.setOpacity(Number.isFinite(numeric) ? numeric : 0);
    },
    [cropStore]
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

  const handleUndo = useCallback(() => {
    cropStore.undo();
  }, [cropStore]);

  const handleRedo = useCallback(() => {
    cropStore.redo();
  }, [cropStore]);

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
                  toolStore.setOriginalLang(
                    event.target.value as AppLanguageCode
                  )
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
                  toolStore.setTranslatedLang(
                    event.target.value as AppLanguageCode
                  )
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
          </>
        );
    }
  };

  return (
    <div className="options-bar">
      <div className="options-title">{activeTool.toUpperCase()} TOOL</div>
      {renderToolOptions()}
      <div className="options-right">
        <div className="options-history">
          <button
            type="button"
            className="options-button"
            onClick={handleUndo}
            disabled={!canUndo}
            title="되돌리기 (Ctrl+Z)"
            aria-label="되돌리기"
          >
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="options-button"
            onClick={handleRedo}
            disabled={!canRedo}
            title="다시 실행 (Ctrl+Shift+Z)"
            aria-label="다시 실행"
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          </button>
        </div>
        <button className="options-button">
          <i className="bi bi-question-circle" aria-hidden="true" /> Learn
        </button>
      </div>
    </div>
  );
};

export default OptionsBar;
