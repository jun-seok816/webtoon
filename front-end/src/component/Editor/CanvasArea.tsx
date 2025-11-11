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

const DEFAULT_CROP: Crop = {
  unit: "%",
  x: 10,
  y: 10,
  width: 16,
  height: 10,
};


const CanvasArea: React.FC<CanvasAreaProps> = ({ editor }) => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<Map<string | number, HTMLImageElement>>(new Map());
  const selectedBatch = editor.pt_selectedUploadBatch;
  const selectedItems = useMemo(
    () => selectedBatch?.items ?? [],
    [selectedBatch]
  );
  const [navigatorViewportMetrics, setNavigatorViewportMetrics] =
    useState<NavigatorViewportMetrics>({
      top: 0,
      height: 18,
    });

  const zoom = editor.pt_zoom || 100;
  const navigatorViewportScale = Math.max(0.25, Math.min(1.3, 100 / zoom));
  const [crop, setCrop] = useState<Crop | undefined>(DEFAULT_CROP);
  const updateNavigatorViewport = useCallback(() => {
    const viewportElement = scrollViewportRef.current;
    if (!viewportElement) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = viewportElement;
    const scrollableHeight = Math.max(scrollHeight - clientHeight, 0);
    const scrollRatio = scrollableHeight > 0 ? scrollTop / scrollableHeight : 0;
    const visibleRatio = scrollHeight > 0 ? clientHeight / scrollHeight : 1;
    const clampedVisibleRatio = Math.min(Math.max(visibleRatio, 0.06), 1);
    const heightPercent = clampedVisibleRatio * 100;
    const maxTop = Math.max(100 - heightPercent, 0);
    const topPercent = scrollRatio * maxTop;

    setNavigatorViewportMetrics((previous) => {
      if (
        Math.abs(previous.top - topPercent) < 0.1 &&
        Math.abs(previous.height - heightPercent) < 0.1
      ) {
        return previous;
      }
      return {
        top: topPercent,
        height: heightPercent,
      };
    });
  }, []);

  const handleImageLoad = useCallback(() => {
    updateNavigatorViewport();
  }, [updateNavigatorViewport]);

  const setImageRef = useCallback(
    (id: string | number, element: HTMLImageElement | null) => {
      if (element) {
        imageRefs.current.set(id, element);
      } else {
        imageRefs.current.delete(id);
      }
    },
    []
  );

  useEffect(() => {
    updateNavigatorViewport();
  }, [zoom, selectedItems.length, selectedBatch?.id, updateNavigatorViewport]);

  useEffect(() => {
    const viewportElement = scrollViewportRef.current;
    if (!viewportElement) {
      return;
    }
    viewportElement.scrollTo({ top: 0 });
  }, [selectedBatch?.id]);

  useEffect(() => {
    const viewportElement = scrollViewportRef.current;
    if (!viewportElement) {
      return;
    }

    const handleScroll = () => {
      updateNavigatorViewport();
    };

    viewportElement.addEventListener("scroll", handleScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateNavigatorViewport();
      });
      resizeObserver.observe(viewportElement);
    }

    const handleWindowResize = () => {
      updateNavigatorViewport();
    };
    window.addEventListener("resize", handleWindowResize);

    updateNavigatorViewport();

    return () => {
      viewportElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleWindowResize);
      resizeObserver?.disconnect();
    };
  }, [updateNavigatorViewport]);

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
                          ref={(element) => setImageRef(item.id, element)}
                          onLoad={handleImageLoad}
                          onError={handleImageLoad}
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
