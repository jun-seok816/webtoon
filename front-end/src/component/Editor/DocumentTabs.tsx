import React, { useCallback, useEffect, useState } from "react";
import type { UploadListItemDto } from "@shared/types/uploads";

interface DocumentTabsProps {
  items: UploadListItemDto[];
  onTabClick: (id: string | number) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
}

const DocumentTabs: React.FC<DocumentTabsProps> = ({
  items,
  onTabClick,
  onReorder,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [items]);

  const handleTabDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, index: number) => {
      if (items.length < 2) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      setDraggingIndex(index);
      setDragOverIndex(index);
    },
    [items]
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
        onReorder(draggingIndex, index);
      }
      setDraggingIndex(null);
      setDragOverIndex(null);
    },
    [draggingIndex, onReorder]
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
      {items.map((item, index) => {
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
            draggable={items.length > 1}
            onClick={() => onTabClick(item.id)}
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
