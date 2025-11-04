import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { Editor } from "./Layout";
import "./CanvasArea.scss";

const LONG_IMAGE_WIDTH = 1000;
const LONG_IMAGE_HEIGHT = 5400;

const createLongImageSvg = () => {
  const horizontalGuides = Array.from({ length: 18 })
    .map((_, index) => {
      const y = Math.round(((index + 1) * LONG_IMAGE_HEIGHT) / 18);
      return `<line x1="80" y1="${y}" x2="${
        LONG_IMAGE_WIDTH - 80
      }" y2="${y}" />`;
    })
    .join("");

  const sectionLabels = Array.from({ length: 9 })
    .map((_, index) => {
      const y = Math.round(((index + 1) * LONG_IMAGE_HEIGHT) / 9 - 24);
      return `<text x="120" y="${y}">Panel ${index + 1}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LONG_IMAGE_WIDTH}" height="${LONG_IMAGE_HEIGHT}" viewBox="0 0 ${LONG_IMAGE_WIDTH} ${LONG_IMAGE_HEIGHT}">
    <defs>
      <linearGradient id="scroll-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1f2330" />
        <stop offset="50%" stop-color="#171b27" />
        <stop offset="100%" stop-color="#11131b" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#scroll-bg)" />
    <g stroke="#2b3242" stroke-width="1" opacity="0.45">
      ${horizontalGuides}
    </g>
    <g stroke="rgba(255, 255, 255, 0.04)" stroke-width="1">
      <rect x="72" y="120" width="${LONG_IMAGE_WIDTH - 144}" height="${
    LONG_IMAGE_HEIGHT - 240
  }" rx="36" />
    </g>
    <g font-family="Inter, sans-serif" font-size="48" fill="#4f5d75" opacity="0.45">
      ${sectionLabels}
    </g>
    <g font-family="Inter, sans-serif" font-size="64" fill="#6476a1" opacity="0.55">
      <text x="50%" y="180" text-anchor="middle">Storyboard Preview</text>
    </g>
  </svg>`;
};

const longImagePlaceholder = `data:image/svg+xml,${encodeURIComponent(
  createLongImageSvg()
)}`;

interface NavigatorViewportMetrics {
  top: number;
  height: number;
}

interface CanvasAreaProps {
  editor: Editor;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ editor }) => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
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
  }, [zoom, updateNavigatorViewport]);

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
                <img
                  className="scroll-viewer__image"
                  src={longImagePlaceholder}
                  width={LONG_IMAGE_WIDTH}
                  height={LONG_IMAGE_HEIGHT}
                  alt="Storyboard preview"
                  onLoad={handleImageLoad}
                />
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
