import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Editor } from "./Layout";
import "./CanvasArea.scss";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import DocumentTabs from "./DocumentTabs";
import { OcrRequestBody, OcrResponseBody } from "@shared/types/ocr";
import {
  TranslateRequestBody,
  TranslateResponseBody,
} from "@shared/types/translate";
import { CropOverlayLayer } from "./CropOverlayLayer";
import type { CropOverlayBox } from "./CropOverlayTypes";

interface CanvasAreaProps {
  editor: Editor;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getCropRect = (image: HTMLImageElement, crop: Crop | undefined) => {
  if (!crop || !crop.width || !crop.height) {
    return null;
  }
  const displayedWidth = image.width;
  const displayedHeight = image.height;
  if (!displayedWidth || !displayedHeight) {
    return null;
  }

  const unit = crop.unit ?? "px";
  const valueToPixels = (
    value: number | undefined,
    dimension: number
  ): number => {
    if (typeof value !== "number") {
      return 0;
    }
    return unit === "%"
      ? (value / 100) * dimension
      : value;
  };

  const cropX = valueToPixels(crop.x ?? 0, displayedWidth);
  const cropY = valueToPixels(crop.y ?? 0, displayedHeight);
  const cropWidth = valueToPixels(crop.width, displayedWidth);
  const cropHeight = valueToPixels(crop.height, displayedHeight);

  if (!cropWidth || !cropHeight) {
    return null;
  }

  const scaleX = image.naturalWidth / displayedWidth;
  const scaleY = image.naturalHeight / displayedHeight;

  const naturalX = clamp(Math.round(cropX * scaleX), 0, image.naturalWidth);
  const naturalY = clamp(Math.round(cropY * scaleY), 0, image.naturalHeight);
  const naturalWidth = clamp(
    Math.round(cropWidth * scaleX),
    1,
    image.naturalWidth - naturalX
  );
  const naturalHeight = clamp(
    Math.round(cropHeight * scaleY),
    1,
    image.naturalHeight - naturalY
  );

  return {
    x: naturalX,
    y: naturalY,
    width: naturalWidth,
    height: naturalHeight,
  };
};

const cropImageToBase64 = (
  image: HTMLImageElement,
  crop: Crop | undefined,
  mimeType: string = "image/png"
) => {
  const cropRect = getCropRect(image, crop);
  if (!cropRect) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = cropRect.width;
  canvas.height = cropRect.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D 컨텍스트를 생성할 수 없습니다.");
  }

  ctx.drawImage(
    image,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    cropRect.width,
    cropRect.height
  );

  return canvas.toDataURL(mimeType);
};

const getDisplayedCropBox = (
  image: HTMLImageElement,
  crop: Crop | undefined
): Pick<CropOverlayBox, "x" | "y" | "width" | "height"> | null => {
  if (!crop || !crop.width || !crop.height) {
    return null;
  }

  const displayedWidth = image.width;
  const displayedHeight = image.height;
  if (!displayedWidth || !displayedHeight) {
    return null;
  }

  const unit = crop.unit ?? "px";
  const valueToPixels = (
    value: number | undefined,
    dimension: number
  ): number => {
    if (typeof value !== "number") {
      return 0;
    }
    return unit === "%" ? (value / 100) * dimension : value;
  };

  return {
    x: valueToPixels(crop.x ?? 0, displayedWidth),
    y: valueToPixels(crop.y ?? 0, displayedHeight),
    width: valueToPixels(crop.width, displayedWidth),
    height: valueToPixels(crop.height, displayedHeight),    
  };
};

const CanvasArea: React.FC<CanvasAreaProps> = ({ editor }) => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<Map<string | number, HTMLImageElement>>(new Map());
  const toolStore = editor.tools;
  const cropStore = editor.crops;
  const colorPalette = editor.colorPalette;
  const ocrClient = editor.ocrClient;
  const translateClient = editor.translateClient;
  const selectedBatch = editor.uploadHistory.currentBatch;
  const selectedItems = useMemo(
    () => selectedBatch?.items ?? [],
    [selectedBatch]
  );
  const selectedBatchId = selectedBatch?.id ?? null;
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const cropBoxes = cropStore.boxes;

  useEffect(() => {
    cropStore.clear({ skipHistory: true, resetHistory: true });
  }, [cropStore, selectedBatchId]);

  const lftranslate = useCallback(
    async (ocr: OcrResponseBody): Promise<TranslateResponseBody | null> => {
      if (!ocr.success) {
        return null;
      }

      const payload: TranslateRequestBody = {
        text: ocr.text,
        sourceLang: toolStore.originalLang,
        targetLang: toolStore.translatedLang,
      };

      try {
        translateClient.im_ClearResponse();
        return await translateClient.im_Translate(payload);
      } catch (error) {
        console.error("[CanvasArea] 번역 요청 실패", error);
        return null;
      }
    },
    [toolStore, translateClient]
  );

  const handleCropComplete = useCallback(
    async (itemId: string | number, completedCrop: Crop | undefined) => {
      const imageElement = imageRefs.current.get(itemId);
      if (!imageElement) {
        return;
      }
      const imageDataUrl = cropImageToBase64(imageElement, completedCrop);
      if (!imageDataUrl) {
        return;
      }

      const overlayBox = getDisplayedCropBox(imageElement, completedCrop);
      const payload: OcrRequestBody = {
        language: toolStore.originalLang,
        batchId: selectedBatchId ?? -1,
        image: imageDataUrl,
      };

      try {
        const res = await ocrClient.im_RequestOcr(payload);
        const translationPromise = lftranslate(res);

        if (res.success && overlayBox) {
          const backgroundColor = colorPalette.pt_primaryColor;
          const textColor = colorPalette.pt_secondaryColor;
          const editorOpacity = cropStore.opacity;
          const newOverlay: CropOverlayBox = {
            id: `${itemId}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
            itemId,
            ...overlayBox,
            originText:res.text,
            text: "",
            backgroundColor,
            textColor,
            opacity: editorOpacity,
          };

          cropStore.addOverlay(newOverlay);

          translationPromise
            .then((translationRes) => {
              if (!translationRes?.success) {
                return;
              }

              cropStore.setOverlayText(newOverlay.id, translationRes.translatedText);
            })
            .catch((error) => {
              console.error("[CanvasArea] 번역 결과 업데이트 실패", error);
            });
        }
      } catch (error) {
        console.error("[CanvasArea] OCR 요청 실패", error);
      }
    },
    [colorPalette, cropStore, lftranslate, ocrClient, selectedBatchId, toolStore]
  );

  return (
    <section className="canvas-area">
      <div className="canvas-header">
        <DocumentTabs
          editor={editor}
          scrollViewportRef={scrollViewportRef}
          imageRefs={imageRefs}
        />
      </div>

      <div className="canvas-body">
        <div className="canvas-wrapper">
          <div className="scroll-viewer">
            <div className="scroll-viewer__frame">
              <div className="scroll-viewer__viewport" ref={scrollViewportRef}>
                {selectedItems.length === 0 ? (
                  <div className="scroll-viewer__empty-state">
                    업로드 내역에서 배치를 선택하면 미리보기가 표시됩니다.
                  </div>
                ) : (
                  <div className="scroll-viewer__image-stack">
                    {selectedItems.map((item) => (
                      <div className="scroll-viewer__image-wrapper" key={item.id}>
                        <ReactCrop
                          crop={crop}
                          className="scroll-viewer__crop"
                          onDragEnd={() => setCrop(undefined)}
                          onChange={(nextCrop) => setCrop(nextCrop)}
                          onComplete={(nextCrop) =>
                            handleCropComplete(item.id, nextCrop)
                          }
                        >
                          <img
                            className="scroll-viewer__image"
                            src={item.url}
                            alt={item.originalName}
                            crossOrigin="anonymous"
                            ref={(node) => {
                              if (node) {
                                imageRefs.current.set(item.id, node);
                              } else {
                                imageRefs.current.delete(item.id);
                              }
                            }}
                          />
                        </ReactCrop>
                        {cropBoxes.length > 0 && (
                          <CropOverlayLayer editor={editor} itemId={item.id} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CanvasArea;
