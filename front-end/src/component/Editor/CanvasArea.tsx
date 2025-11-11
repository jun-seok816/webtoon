import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Editor } from "./Layout";
import "./CanvasArea.scss";
import ReactCrop, { Crop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import DocumentTabs from "./DocumentTabs";

interface NavigatorViewportMetrics {
  top: number;
  height: number;
}

interface CanvasAreaProps {
  editor: Editor;
}


const CanvasArea: React.FC<CanvasAreaProps> = ({ editor }) => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<Map<string | number, HTMLImageElement>>(new Map());
  const selectedBatch = editor.pt_selectedUploadBatch;
  const selectedItems = useMemo(
    () => selectedBatch?.items ?? [],
    [selectedBatch]
  );  
  const [crop, setCrop] = useState<Crop | undefined>(undefined);


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
                      <ReactCrop
                        crop={crop}
                        key={item.id}
                        className="scroll-viewer__crop"
                        onDragEnd={() => setCrop(undefined)}
                        onChange={(nextCrop) => setCrop(nextCrop)}
                        onComplete={()=>{}}                        
                      >
                        <img
                          className="scroll-viewer__image"
                          src={item.url}
                          alt={item.originalName}                                              
                        />
                      </ReactCrop>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* <aside className="canvas-navigator">
          <div className="navigator-header">
            <span>Navigator</span>
            <button aria-label="Navigator options">
              <i className="bi bi-three-dots" aria-hidden="true" />
            </button>
          </div>
          <div className="navigator-thumbnail">
            <div className="navigator-long-preview">
              <div className="navigator-long-preview__track">
                <div
                  className="navigator-viewport"
                  style={{
                    transform: `scaleY(${navigatorViewportScale})`,
                    top: `${navigatorViewportMetrics.top}%`,
                    height: `${navigatorViewportMetrics.height}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </aside> */}
      </div>
    </section>
  );
};

export default CanvasArea;
