import axios from "axios";
import { Main } from "@jsLib/class/Main_class";
import type { UploadBatchDto, UploadListResponseDto } from "@shared/types/uploads";

type Notify = () => void;

export class EditorUploadHistoryStore {
  private selectedBatch: UploadBatchDto | null = null;
  private userBatches: UploadBatchDto[] = [];
  private testBatches: UploadBatchDto[] = [];

  constructor(private readonly notify: Notify) {}

  public get currentBatch() {
    return this.selectedBatch;
  }

  public setCurrentBatch(batch: UploadBatchDto | null) {
    if (this.selectedBatch === batch) {
      return;
    }
    this.selectedBatch = batch;
    this.notify();
  }

  public getBatches(mode: "user" | "test" = "user") {
    return mode === "test" ? this.testBatches : this.userBatches;
  }

  public async loadHistory(mode: "user" | "test" = "user") {
    const endpoint = mode === "test" ? "/api/uploads/test" : "/api/uploads";
    const { data } = await axios.get<UploadListResponseDto>(endpoint);
    if (data.success) {
      if (mode === "test") {
        this.testBatches = data.batches;
      } else {
        this.userBatches = data.batches;
      }
      this.notify();
    } else {
      const fallback =
        mode === "test"
          ? "테스트 배치를 불러오지 못했습니다."
          : "업로드 내역을 불러오지 못했습니다.";
      Main.im_toast(data.message ?? fallback, "error");
    }
    return data;
  }

  public reorderSelectedItems(sourceIndex: number, destinationIndex: number) {
    if (!this.selectedBatch) {
      return;
    }
    const items = this.selectedBatch.items;
    const maxIndex = items.length - 1;
    if (
      sourceIndex === destinationIndex ||
      sourceIndex < 0 ||
      destinationIndex < 0 ||
      sourceIndex > maxIndex ||
      destinationIndex > maxIndex
    ) {
      return;
    }

    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(sourceIndex, 1);
    updatedItems.splice(destinationIndex, 0, movedItem);

    this.selectedBatch = {
      ...this.selectedBatch,
      items: updatedItems,
    };

    this.notify();
  }
}
