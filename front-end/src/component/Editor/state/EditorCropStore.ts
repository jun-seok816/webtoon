import { CropOverlayBox } from "@shared/types/editorCrops";
import { EditorToolsStore } from "./EditorToolsStore";

type Notify = () => void;

export class EditorCropStore {
  private cropBoxes: CropOverlayBox[] = [];
  private cropHistory: CropOverlayBox[][] = [];
  private cropHistoryIndex = 0;
  private readonly cropHistoryLimit = 50;
  private sBox: CropOverlayBox | undefined;

  constructor(private readonly notify: Notify) {
    this.initializeHistory();
  }

  public get boxes() {
    return this.cropBoxes;
  }

  public get selectBox() {
    return this.sBox;
  }

  public setSelectBox(id?: string) {
    if (!id) {
      this.sBox = undefined;
      this.notify();
      return;
    }
    const selected = this.cropBoxes.find((box) => box.id === id);
    this.sBox = selected;
    this.notify();
  }

  public setInintSelectBox() {
    this.sBox = undefined;
    this.notify();
  }

  public get canUndo() {
    return this.cropHistoryIndex > 0;
  }

  public get canRedo() {
    return this.cropHistoryIndex < this.cropHistory.length - 1;
  }

  public initOverlay(boxs: CropOverlayBox[]) {
    this.cropBoxes = boxs;
    this.notify();
  }

  public addOverlay(box: CropOverlayBox) {
    const normalizedOverlay: CropOverlayBox = {
      ...box,
      opacity: EditorToolsStore.normalizeOpacity(box.opacity),
    };
    this.commitBoxes([...this.cropBoxes, normalizedOverlay], {
      recordHistory: false,
    });
  }

  public setOverlayText(
    id: string,
    text: string,
    options: { recordHistory?: boolean } = {}
  ) {
    let updated = false;
    const nextBoxes = this.cropBoxes.map((box) => {
      if (box.id === id) {
        updated = true;
        return { ...box, text };
      }
      return box;
    });
    if (updated) {
      this.commitBoxes(nextBoxes,options);
    }
  }

  public updateOverlayBox(
    id: string,
    nextBox: Partial<Pick<CropOverlayBox, "x" | "y" | "width" | "height">>,
    options: { recordHistory?: boolean } = {}
  ) {
    const recordHistory = options.recordHistory ?? true;
    let updated = false;
    const nextBoxes = this.cropBoxes.map((box) => {
      if (box.id !== id) {
        return box;
      }
      updated = true;
      const nextX = this.normalizeNumericValue(nextBox.x, box.x);
      const nextY = this.normalizeNumericValue(nextBox.y, box.y);
      const nextWidth = this.normalizeDimension(nextBox.width, box.width);
      const nextHeight = this.normalizeDimension(nextBox.height, box.height);
      return {
        ...box,
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
      };
    });

    if (updated) {
      this.commitBoxes(nextBoxes, { recordHistory });
    }
  }

  public removeOverlay(id: string) {
    const nextBoxes = this.cropBoxes.filter((box) => box.id !== id);
    if (nextBoxes.length === this.cropBoxes.length) {
      return;
    }
    this.commitBoxes(nextBoxes);
  }

  public setSelectedOverlayOpacity(opacity: number) {
    if (!this.sBox) {
      return;
    }
    const normalizedOpacity = EditorToolsStore.normalizeOpacity(opacity);
    let updated = false;
    const nextBoxes = this.cropBoxes.map((box) => {
      if (box.id !== this.sBox?.id) {
        return box;
      }
      if (box.opacity === normalizedOpacity) {
        return box;
      }
      updated = true;
      return { ...box, opacity: normalizedOpacity };
    });
    if (updated) {
      this.commitBoxes(nextBoxes);
    }
  }

  public clear(
    options: { skipHistory?: boolean; resetHistory?: boolean } = {}
  ) {
    const skipHistory = options.skipHistory ?? false;
    const resetHistory = options.resetHistory ?? false;
    if (this.cropBoxes.length === 0 && !resetHistory) {
      return;
    }
    this.commitBoxes([], { recordHistory: !skipHistory });
    if (resetHistory) {
      this.initializeHistory();
    }
  }

  public undo() {
    if (!this.canUndo) {
      return;
    }
    this.cropHistoryIndex -= 1;
    const snapshot = this.cropHistory[this.cropHistoryIndex] ?? [];
    this.commitBoxes(this.cloneBoxes(snapshot), { recordHistory: false });
  }

  public redo() {
    if (!this.canRedo) {
      return;
    }
    this.cropHistoryIndex += 1;
    const snapshot = this.cropHistory[this.cropHistoryIndex] ?? [];
    this.commitBoxes(this.cloneBoxes(snapshot), { recordHistory: false });
  }

  private normalizeNumericValue(value: number | undefined, fallback: number) {
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : fallback;
  }

  private normalizeDimension(value: number | undefined, fallback: number) {
    const normalized = this.normalizeNumericValue(value, fallback);
    return Math.max(1, normalized);
  }

  private cloneBoxes(boxes: CropOverlayBox[]) {
    return boxes.map((box) => ({ ...box }));
  }

  private initializeHistory() {
    this.cropHistory = [this.cloneBoxes(this.cropBoxes)];
    this.cropHistoryIndex = 0;
  }

  private pushHistorySnapshot(boxes: CropOverlayBox[]) {
    console.log("call pushHistorySnapshot");
    const historyUpToCurrent = this.cropHistory.slice(
      0,
      this.cropHistoryIndex + 1
    );
    historyUpToCurrent.push(this.cloneBoxes(boxes));
    const overflow = historyUpToCurrent.length - this.cropHistoryLimit;
    if (overflow > 0) {
      historyUpToCurrent.splice(0, overflow);
    }
    this.cropHistory = historyUpToCurrent;
    this.cropHistoryIndex = this.cropHistory.length - 1;
  }

  private commitBoxes(
    nextBoxes: CropOverlayBox[],
    options: { recordHistory?: boolean } = {}
  ) {
    const recordHistory = options.recordHistory ?? true;
    this.cropBoxes = nextBoxes;
    if (recordHistory) {
      this.pushHistorySnapshot(nextBoxes);
    }
    this.notify();
  }
}
