import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Moveable, {
  type OnClick,
  type OnDrag,
  type OnDragEnd,
} from "react-moveable";
import type { Editor } from "./Layout";
import { CropOverlayBox } from "@shared/types/editorCrops";

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
  const cropBoxes = editor.crops.boxes;
  const currentBoxes = useMemo(
    () => cropBoxes.filter((box) => box.itemId === itemId),
    [cropBoxes, itemId]
  );

  if (currentBoxes.length === 0) {
    return null;
  }

  return (
    <div className="scroll-viewer__overlay-layer">
      {currentBoxes.map((box) => {
        return <CropOverlay key={box.id} editor={editor} box={box} />;
      })}
    </div>
  );
};

interface CropOverlayProps {
  box: CropOverlayBox;
  editor: Editor;
}

const CropOverlay: React.FC<CropOverlayProps> = ({ box, editor }) => {
  const cropStore = editor.crops;
  const toolStore = editor.tools;
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const handleRef = useCallback((node: HTMLDivElement | null) => {
    setTarget(node);
  }, []);
  const latestBoxRef = useRef({
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  });

  useEffect(() => {
    latestBoxRef.current = {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
    if (target) {
      target.style.transform = "translate(0px, 0px)";
    }
  }, [box.height, box.width, box.x, box.y, target]);

  const percentToOpacity = useMemo(() => {
    const clamp = (num: number, min: number, max: number) =>
      Math.min(max, Math.max(min, num));
    return (percent: number) => clamp(percent / 100, 0, 1);
  }, []);

  const handleDrag = useCallback(
    ({
      target: dragTarget,
      left,
      top,
    }: {
      target: any;
      left: any;
      top: any;
    }) => {
      if (!dragTarget) {
        return;
      }
      dragTarget.style.left = `${left}px`;
      dragTarget.style.top = `${top}px`;
      dragTarget.style.transform = "translate(0px, 0px)";
      latestBoxRef.current = {
        ...latestBoxRef.current,
        x: left,
        y: top,
      };
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    const { x, y, width, height } = latestBoxRef.current;
    if (
      x === box.x &&
      y === box.y &&
      width === box.width &&
      height === box.height
    ) {
      return;
    }
    cropStore.updateOverlayBox(box.id, { x, y, width, height });
  }, [box.height, box.id, box.width, box.x, box.y, cropStore]);

  return (
    <>
      <div
        ref={handleRef}
        className="crop-overlay"
        data-overlay-id={box.id}
        onClick={(e) => {
          e.stopPropagation();          
          cropStore.setSelectBox(box.id);
        }}
        data-item-id={box.itemId}
        style={{
          pointerEvents: "auto",
          top: `${box.y}px`,
          left: `${box.x}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
          transform: "translate(0px, 0px)",
          backgroundColor: hexToRgba(
            box.backgroundColor ?? "#ffffff",
            percentToOpacity(box.opacity ?? 100)
          ),
          border: `${
            cropStore.selectBox?.id === box.id ? " 3px dotted #5b72f245" : ""
          }`,
        }}
      >
        {box.text && (
          <div className="crop-overlay__text" style={{ color: box.textColor }}>
            {box.text}
          </div>
        )}
      </div>
      {target && (
        <Moveable
          target={target}
          draggable
          resizable={false}
          scalable={false}
          rotatable={false}
          pinchable={false}
          edgeDraggable={false}
          origin={false}
          hideDefaultLines={false}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      )}
    </>
  );
};
