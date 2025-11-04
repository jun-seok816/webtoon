export class LoginModalState {
  private readonly iv_forceRender: () => void;
  private iv_isOpen = true;
  private iv_email = "";
  private iv_password = "";
  private iv_isSubmitting = false;

  constructor(forceRender: () => void) {
    this.iv_forceRender = forceRender;
  }

  public get pt_isOpen() {
    return this.iv_isOpen;
  }

  public get pt_email() {
    return this.iv_email;
  }

  public get pt_password() {
    return this.iv_password;
  }

  public get pt_isSubmitting() {
    return this.iv_isSubmitting;
  }

  public im_Open() {
    if (this.iv_isOpen) return;
    this.iv_isOpen = true;
    this.iv_forceRender();
  }

  public im_Close() {
    if (!this.iv_isOpen) return;
    this.iv_isOpen = false;
    this.iv_forceRender();
  }

  public im_SetEmail(next: string) {
    if (this.iv_email === next) return;
    this.iv_email = next;
    this.iv_forceRender();
  }

  public im_SetPassword(next: string) {
    if (this.iv_password === next) return;
    this.iv_password = next;
    this.iv_forceRender();
  }

  public im_ResetFields() {
    this.iv_email = "";
    this.iv_password = "";
    this.iv_forceRender();
  }

  public im_SetSubmitting(flag: boolean) {
    if (this.iv_isSubmitting === flag) return;
    this.iv_isSubmitting = flag;
    this.iv_forceRender();
  }
}
