import React, { useCallback, useEffect, useState } from "react";
import type { Editor } from "./Layout";

interface DocumentTabsProps {
  editor: Editor;
  scrollViewportRef: React.RefObject<HTMLDivElement | null>;
  imageRefs: React.MutableRefObject<Map<string | number, HTMLImageElement>>;
}

const DocumentTabs: React.FC<DocumentTabsProps> = ({
  editor,
  scrollViewportRef,
  imageRefs,
}) => {
  const uploadHistory = editor.uploadHistory;
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const selectedBatch = uploadHistory.currentBatch;
  const selectedItems = selectedBatch?.items ?? [];
  const selectedBatchId = selectedBatch?.id;

  useEffect(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [selectedBatchId, selectedItems.length]);

  const scrollImageIntoView = useCallback(
    (id: string | number) => {
      const viewport = scrollViewportRef.current;
      const imageElement = imageRefs.current.get(id);
      if (!viewport || !imageElement) {
        return;
      }
      const imageTop =
        imageElement.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top +
        viewport.scrollTop;
      const imageBottom = imageTop + imageElement.offsetHeight;
      const currentScrollTop = viewport.scrollTop;
      const viewportHeight = viewport.clientHeight;

      if (imageTop < currentScrollTop) {
        viewport.scrollTo({ top: imageTop, behavior: "smooth" });
      } else if (imageBottom > currentScrollTop + viewportHeight) {
        viewport.scrollTo({
          top: imageBottom - viewportHeight,
          behavior: "smooth",
        });
      }
    },
    [imageRefs, scrollViewportRef]
  );

  const handleTabClick = useCallback(
    (id: string | number) => {
      scrollImageIntoView(id);
    },
    [scrollImageIntoView]
  );

  return (
    <div className="document-tabs">
      {selectedItems.map((item, index) => {
        const isDragging = index === draggingIndex;
        const isDropTarget =
          draggingIndex !== null && !isDragging && index === dragOverIndex;
        const tabClassName = [
          "document-tab",
          isDragging ? "document-tab--dragging" : "",
          isDropTarget ? "document-tab--drop-target" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={item.id}
            type="button"
            className={tabClassName}
            onClick={() => handleTabClick(item.id)}
          >
            <span className="document-tab__name">{item.filename}</span>
            <span className="document-tab__meta">{item.mimetype}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DocumentTabs;
