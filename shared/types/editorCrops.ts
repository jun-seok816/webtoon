export interface CropOverlayBox {
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
  overlays: CropOverlayBox[];
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

export interface GetCropOverlaysSuccessResponse {
  success: true;
  overlays: CropOverlayBox[];
}

export interface GetCropOverlaysErrorResponse {
  success: false;
  message: string;
}

export type GetCropOverlaysResponse =
  | GetCropOverlaysSuccessResponse
  | GetCropOverlaysErrorResponse;
