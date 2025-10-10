import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;  
};
export class Upload {
  // 인스턴스 변수(iv_)
  private iv_items: ImageItem[] = [];
  private iv_title = "";
  private iv_uploadPct = 0;
  public im_forceRender: () => void;

  constructor(forceRender: () => void) {
    this.im_forceRender = forceRender;
  }

  // ───────── 게터/세터 (pt_ 동일 이름) ─────────
  // 제목
  public get pt_Title(): string {
    return this.iv_title;
  }
  public set pt_Title(v: string) {
    this.iv_title = v;
  }
  //이미지
  public get pt_items(): ImageItem[] {
    return this.iv_items;
  }
  public set pt_items(v: ImageItem[]) {
    this.iv_items = v;
  }
  // 진행률(외부 수정 금지)
  public get pt_UploadPct(): number {
    return this.iv_uploadPct;
  }

  // ───────── 변경 메서드(im_) ─────────

  public im_Remove(id: string) {
    const t = this.iv_items.find((x) => x.id === id);
    if (t) URL.revokeObjectURL(t.previewUrl);
    this.iv_items = this.iv_items.filter((x) => x.id !== id);
    this.im_forceRender();
  }

  public im_Move(id: string, delta: number) {
    const arr = [...this.iv_items];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const ni = Math.max(0, Math.min(arr.length - 1, idx + delta));
    if (ni === idx) return;
    const [spliced] = arr.splice(idx, 1);
    arr.splice(ni, 0, spliced);
    this.iv_items = arr;
    this.im_forceRender();
  }

  public im_Clear() {
    this.iv_items.forEach((x) => URL.revokeObjectURL(x.previewUrl));
    this.iv_items = [];
    this.im_forceRender();
  }

  // ───────── 전송 ─────────
  private im_ToFormData(extra?: Record<string, string | number | boolean>) {
    const form = new FormData();
    form.append("title", this.iv_title);
    if (extra)
      Object.entries(extra).forEach(([k, v]) => form.append(k, String(v)));
    this.iv_items.forEach((it, idx) => {
      const padded = String(idx + 1).padStart(3, "0");
      form.append("images", it.file, `${padded}_${it.name}`);
    });
    return form;
  }

  public async im_UploadFormData(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<any>> {
    if (!this.iv_items.length) throw new Error("이미지를 선택하세요.");

    const res = await axios.post(endpoint, this.im_ToFormData(), {
      ...config,
      onUploadProgress: (e) => {
        if (e.total) {
          this.iv_uploadPct = Math.round((e.loaded / e.total) * 100);
        }
        config?.onUploadProgress?.(e);
      },
    });

    return res;
  }
}
