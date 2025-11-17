export interface CropOverlayBox {
  id: string;
  itemId: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  originText: string
  backgroundColor: string;
  textColor: string;
  opacity?: number;
}
