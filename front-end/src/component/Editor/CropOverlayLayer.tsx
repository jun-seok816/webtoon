import React, { useCallback, useMemo, useState } from "react";
import Moveable from "react-moveable";
import type { Editor } from "./Layout";
import type { CropOverlayBox } from "./CropOverlayTypes";

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
        }}
      >
        {box.text && <div className="crop-overlay__text">{box.text}</div>}
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
