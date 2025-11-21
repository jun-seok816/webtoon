import { Main } from "./Main_class";

declare global {
  interface Window {
    roboflow: any;
  }
}

interface RoboResult {
  bbox: {
    page: number;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class RoboFlow {
  private readonly iv_forceRender: () => void;
  private iv_isLoading = false;
  private iv_result: RoboResult[] = [];

  public get pt_loading() {
    return this.iv_isLoading;
  }

  public get pt_result() {
    return this.iv_result;
  }

  constructor(forceRender: () => void) {
    this.iv_forceRender = forceRender;
  }

  private async im_getModel() {
    try {
      const model = await window.roboflow
        .auth({
          publishable_key: "rf_XnMrnCr89vSKw8dl1lU3HUCpLMg2",
        })
        .load({
          model: "text-detection-ce6gu",
          version: 1,
        });
      return model;
    } catch (err) {
      throw new Error("Failed to load the Roboflow model");
    }
  }

  public async im_RobotFlowStart(
    img: HTMLImageElement,
    page: number,
    splitHeight: number = 1200
  ) {
    try {
      this.iv_isLoading = true;
      this.iv_forceRender();
      const element = img;
      const model = await this.im_getModel();

      if (!model) {
        throw new Error("Model is not initialized");
      }

      this.iv_result = [];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx === null) throw Error("is ctx null");

      const imgHeight = element.naturalHeight;
      const imgWidth = element.naturalWidth;

      // 이미지가 1200보다 작거나 같은 경우 자르지 않음
      if (imgHeight <= 1200) {
        // 전체 이미지를 처리
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        ctx.drawImage(element, 0, 0, imgWidth, imgHeight);

        const predictions = (await model.detect(canvas)) as Array<RoboResult>;

        predictions.forEach((predict) => {
          if (predict.bbox) {
            predict.bbox.page = page;
            predict.bbox.x -= predict.bbox.width / 2;
            predict.bbox.y -= predict.bbox.height / 2;
          }
        });

        this.iv_result = [...this.iv_result, ...predictions];
      } else {
        canvas.width = imgWidth;
        canvas.height = splitHeight;        

        for (let y = 0; y < imgHeight; y += splitHeight) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            element,
            0,
            y,
            imgWidth,
            splitHeight,
            0,
            0,
            imgWidth,
            splitHeight
          );

          const predictions = (await model.detect(canvas)) as Array<RoboResult>;

          predictions.forEach((predict) => {
            if (predict.bbox) {
              predict.bbox.page = page;
              predict.bbox.y += y;
              predict.bbox.x -= predict.bbox.width / 2;
              predict.bbox.y -= predict.bbox.height / 2;
            }
          });

          this.iv_result = [...this.iv_result, ...predictions];
        }
      }
    } catch (err) {
      Main.im_toast("말풍선 자동감지 실패", "error");
      console.error("Error in RoboFlow start:", err);
    } finally {
      this.iv_isLoading = false;
      this.iv_forceRender();
    }
  }
}
