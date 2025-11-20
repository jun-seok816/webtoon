type Notify = () => void;

export class EditorUiStore {
  private fileModalOpen = false;
  private uploadHistoryOpen = false;
  private selectedFilesValue: File[] = [];
  private isUploadingValue = false;
  private uploadTitleValue = "";

  constructor(private readonly notify: Notify) {}

  public get isFileModalOpen() {
    return this.fileModalOpen;
  }

  public openFileModal() {
    this.fileModalOpen = true;
    this.uploadHistoryOpen = false;
    this.notify();
  }

  public closeFileModal() {
    if (!this.fileModalOpen) {
      return;
    }
    this.fileModalOpen = false;
    this.notify();
  }

  public get isUploadHistoryOpen() {
    return this.uploadHistoryOpen;
  }

  public openUploadHistory() {
    this.uploadHistoryOpen = true;
    this.fileModalOpen = false;
    this.notify();
  }

  public closeUploadHistory() {
    if (!this.uploadHistoryOpen) {
      return;
    }
    this.uploadHistoryOpen = false;
    this.notify();
  }

  public get selectedFiles() {
    return this.selectedFilesValue;
  }

  public setSelectedFiles(files: File[]) {
    this.selectedFilesValue = [...files];
    this.notify();
  }

  public resetSelectedFiles() {
    if (this.selectedFilesValue.length === 0) {
      return;
    }
    this.selectedFilesValue = [];
    this.notify();
  }

  public get isUploading() {
    return this.isUploadingValue;
  }

  public setIsUploading(value: boolean) {
    if (this.isUploadingValue === value) {
      return;
    }
    this.isUploadingValue = value;
    this.notify();
  }

  public get uploadTitle() {
    return this.uploadTitleValue;
  }

  public setUploadTitle(value: string) {
    if (this.uploadTitleValue === value) {
      return;
    }
    this.uploadTitleValue = value;
    this.notify();
  }

  public resetUploadModalState() {
    this.fileModalOpen = false;
    this.selectedFilesValue = [];
    this.uploadTitleValue = "";
    this.isUploadingValue = false;
    this.notify();
  }
}
