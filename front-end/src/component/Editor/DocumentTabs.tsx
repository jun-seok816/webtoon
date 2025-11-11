import React, { useCallback, useEffect, useState } from "react";
import type { Editor } from "./Layout";

interface DocumentTabsProps {
  editor: Editor;
  scrollViewportRef: React.RefObject<HTMLDivElement | null>;
  imageRefs: React.MutableRefObject<
    Map<string | number, HTMLImageElement>
  >;
}

const DocumentTabs: React.FC<DocumentTabsProps> = ({
  editor,
  scrollViewportRef,
  imageRefs,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const selectedItems = editor.pt_selectedUploadBatch?.items ?? [];
  const selectedBatchId = editor.pt_selectedUploadBatch?.id;

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

      const imageTop = imageElement.offsetTop;
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

  const handleTabDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, index: number) => {
      if (selectedItems.length < 2) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      setDraggingIndex(index);
      setDragOverIndex(index);
    },
    [selectedItems.length]
  );

  const handleTabDragOver = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, index: number) => {
      if (draggingIndex === null) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (index !== dragOverIndex) {
        setDragOverIndex(index);
      }
    },
    [dragOverIndex, draggingIndex]
  );

  const handleTabDrop = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, index: number) => {
      if (draggingIndex === null) {
        return;
      }
      event.preventDefault();
      if (draggingIndex !== index) {
        editor.im_reorderSelectedUploadItems(draggingIndex, index);
      }
      setDraggingIndex(null);
      setDragOverIndex(null);
    },
    [draggingIndex, editor]
  );

  const handleTabDragLeave = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, index: number) => {
      if (draggingIndex === null) {
        return;
      }
      const nextTarget = event.relatedTarget as HTMLElement | null;
      const isMovingInsideSameTab =
        nextTarget?.closest(".document-tab") === event.currentTarget;
      if (!isMovingInsideSameTab && dragOverIndex === index) {
        setDragOverIndex(null);
      }
    },
    [dragOverIndex, draggingIndex]
  );

  const handleTabDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

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
            draggable={selectedItems.length > 1}
            onClick={() => handleTabClick(item.id)}
            onDragStart={(event) => handleTabDragStart(event, index)}
            onDragOver={(event) => handleTabDragOver(event, index)}
            onDrop={(event) => handleTabDrop(event, index)}
            onDragLeave={(event) => handleTabDragLeave(event, index)}
            onDragEnd={handleTabDragEnd}
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
