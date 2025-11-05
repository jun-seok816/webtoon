import axios, { AxiosInstance } from "axios";

export type LoginSession =
  | { loggedIn: false }
  | {
      loggedIn: true;
      email?: string;
      displayName?: string;
      provider?: "local" | "google" | "kakao" | "naver";
    };

interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginStateOptions {
  baseURL?: string;
}

export class LoginModalState {
  private readonly iv_forceRender: () => void;
  private readonly iv_client: AxiosInstance;
  private iv_isOpen = true;
  private iv_email = "";
  private iv_password = "";
  private iv_isSubmitting = false;
  private iv_session: LoginSession | null = null;
  private iv_isLoggingOut = false;

  constructor(forceRender: () => void, options?: LoginStateOptions) {
    this.iv_forceRender = forceRender;
    this.iv_client = axios.create({
      baseURL: options?.baseURL ?? "/api/login",
      withCredentials: true,
    });
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

  public get pt_session() {
    return this.iv_session;
  }

  public get pt_isLoggingOut() {
    return this.iv_isLoggingOut;
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

  public async im_CheckEmailExists(email: string) {
    const { data } = await this.iv_client.post<{
      err: boolean;
      exists: boolean;
    }>("/loginEmailCheck", { email });
    return data;
  }

  public async im_SignUp(payload: SignUpPayload) {
    const { data } = await this.iv_client.post<{
      err: boolean;
      msg?: string;
    }>("/sign_up", payload);
    return data;
  }

  public async im_Login(payload: LoginPayload) {
    const { data } = await this.iv_client.post<{
      err: boolean;
      msg?: string;
    }>("/login", payload);
    return data;
  }

  public async im_SaveGoogleToken(accessToken: string) {
    const { data } = await this.iv_client.post<{
      err: boolean;
      msg?: "login" | "sign_up";
    }>("/save_data_google", { access_token: accessToken });
    return data;
  }

  public async im_GetSession() {
    const { data } = await this.iv_client.get<LoginSession>("/loginSession");
    this.iv_session = data;
    this.iv_forceRender();
    return data;
  }

  public async im_Logout() {
    if (this.iv_isLoggingOut) {
      return { err: true, msg: "logout in progress" };
    }
    this.iv_isLoggingOut = true;
    this.iv_forceRender();
    try {
      const { data } = await this.iv_client.post<{
        err: boolean;
        loggedOut?: boolean;
      }>("/logout");
      if (!data.err) {
        this.iv_session = { loggedIn: false };
      }
      return data;
    } finally {
      this.iv_isLoggingOut = false;
      this.iv_forceRender();
    }
  }
}
