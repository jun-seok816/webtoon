import React, { useCallback, useMemo, useState } from "react";
import Moveable from "react-moveable";
import type { Editor } from "./Layout";
import type { CropOverlayBox } from "./CropOverlayTypes";

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized.padEnd(6, "F");
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface CropOverlayLayerProps {
  editor: Editor;
  itemId: string | number;
}

export const CropOverlayLayer: React.FC<CropOverlayLayerProps> = ({
  editor,
  itemId,
}) => {
  const cropBoxes = editor.pt_cropBoxes;
  const currentBoxes = useMemo(
    () => cropBoxes.filter((box) => box.itemId === itemId),
    [cropBoxes, itemId]
  );

  if (currentBoxes.length === 0) {
    return null;
  }

  return (
    <div className="scroll-viewer__overlay-layer">
      {currentBoxes.map((box) => (
        <CropOverlay key={box.id} box={box} />
      ))}
    </div>
  );
};

interface CropOverlayProps {
  box: CropOverlayBox;
}

const CropOverlay: React.FC<CropOverlayProps> = ({ box }) => {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const handleRef = useCallback((node: HTMLDivElement | null) => {
    setTarget(node);
  }, []);

  return (
    <>
      <div
        ref={handleRef}
        className="crop-overlay"
        style={{
          top: `${box.y}px`,
          left: `${box.x}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
          backgroundColor: hexToRgba(box.backgroundColor ?? "#ffffff", 0.22),
          borderColor: box.backgroundColor,
        }}
      >
        {box.text && (
          <div
            className="crop-overlay__text"
            style={{ color: box.textColor }}
          >
            {box.text}
          </div>
        )}
      </div>
      {target && (
        <Moveable
          target={target}
          draggable={false}
          resizable={false}
          scalable={false}
          rotatable={false}
          pinchable={false}
          edgeDraggable={false}
          origin={false}
          hideDefaultLines={false}
        />
      )}
    </>
  );
};
