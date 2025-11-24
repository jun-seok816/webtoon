export interface CropOverlayDto {
  id: string;
  itemId: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  originText: string;
  backgroundColor: string;
  textColor: string;
  opacity?: number;
}

export interface SaveCropOverlaysRequest {
  batchId: number;
  overlays: CropOverlayDto[];
}

export interface SaveCropOverlaysSuccessResponse {
  success: true;
  insertedCount: number;
}

export interface SaveCropOverlaysErrorResponse {
  success: false;
  message: string;
}

export type SaveCropOverlaysResponse =
  | SaveCropOverlaysSuccessResponse
  | SaveCropOverlaysErrorResponse;
