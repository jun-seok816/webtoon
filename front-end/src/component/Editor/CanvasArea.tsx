import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Editor } from "./Layout";
import "./CanvasArea.scss";

interface NavigatorViewportMetrics {
  top: number;
  height: number;
}

interface CanvasAreaProps {
  editor: Editor;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ editor }) => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const selectedBatch = editor.pt_selectedUploadBatch;
  const selectedItems = useMemo(() => selectedBatch?.items ?? [], [selectedBatch]);
  const [navigatorViewportMetrics, setNavigatorViewportMetrics] =
    useState<NavigatorViewportMetrics>({
      top: 0,
      height: 18
    });

  const zoom = editor.pt_zoom || 100;
  const navigatorViewportScale = Math.max(0.25, Math.min(1.3, 100 / zoom));

  const updateNavigatorViewport = useCallback(() => {
    const viewportElement = scrollViewportRef.current;
    if (!viewportElement) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = viewportElement;
    const scrollableHeight = Math.max(scrollHeight - clientHeight, 0);
    const scrollRatio =
      scrollableHeight > 0 ? scrollTop / scrollableHeight : 0;
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
        height: heightPercent
      };
    });
  }, []);

  const handleImageLoad = useCallback(() => {
    updateNavigatorViewport();
  }, [updateNavigatorViewport]);

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
        <div className="document-tabs">
          <button className="document-tab active">
            <span className="document-tab__name">webtoon-editor.psd</span>
            <span className="document-tab__meta">RGB/8 • 3000 x 5400</span>
          </button>
          <button className="document-tab">
            <span className="document-tab__name">character-sketch.psd</span>
            <span className="document-tab__meta">RGB/8 • 2480 x 3508</span>
          </button>
          <button className="document-tab">
            <span className="document-tab__name">logo.ai</span>
            <span className="document-tab__meta">CMYK • 1200 x 630</span>
          </button>
        </div>        
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
                      <img
                        key={item.id}
                        className="scroll-viewer__image"
                        src={item.url}
                        alt={item.originalName}
                        onLoad={handleImageLoad}
                        onError={handleImageLoad}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <aside className="canvas-navigator">
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
                    height: `${navigatorViewportMetrics.height}%`
                  }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CanvasArea;
