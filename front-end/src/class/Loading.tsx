export class Loading {
  // 인스턴스 변수(iv_)
  public is_loading: boolean;
  public iv_per: number;
  public iv_Name: string;
  public im_forceRender: () => void;

  constructor(forceRender: () => void, iv_Name: string) {
    this.im_forceRender = forceRender;
    this.is_loading = false;
    this.iv_per = 0;
    this.iv_Name = iv_Name;
  }
}
