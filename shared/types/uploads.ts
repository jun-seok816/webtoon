export type UploadListItemDto = {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  convertedFromPsd: boolean;
};

export type UploadBatchDto = {
  id: number;
  uuid: string;
  title: string | null;
  status: string;
  fileCount: number;
  totalSize: number;
  items: UploadListItemDto[];
  isTest: boolean;
};

export type UploadListSuccessDto = {
  success: true;
  batches: UploadBatchDto[];
};

export type UploadListErrorDto = {
  success: false;
  message: string;
};

export type UploadListResponseDto = UploadListSuccessDto | UploadListErrorDto;
