import React, {
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import ReactModal from "react-modal";
import { Main } from "@jsLib/class/Main_class";
import {
  LoginModalState,
  LoginSession,
} from "@jsLib/class/Login";
import SignUpSelectBtns from "./SignUp_select_btns";
import "./Login.scss";

if (typeof document !== "undefined") {
  ReactModal.setAppElement("#app");
}

declare global {
  interface Window {
    globalCallback_login?: () => void;
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [main] = useState(() => new Main());
  const [loginStore] = useState(
    () => new LoginModalState(main.im_forceRender.bind(main))
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [session, setSession] = useState<LoginSession | null>(null);

  main.im_Prepare_Hooks();
  main.im_Mounted(() => {
    loginStore.im_ResetFields();
    loginStore.im_SetSubmitting(false);
    loginStore.im_Open();
  });

  const subtitleId = useId();

  const handleClose = useMemo(
    () => () => {
      loginStore.im_Close();
      navigate("/");
    },
    [loginStore, navigate]
  );

  const refreshSession = useMemo(
    () => async () => {
      try {
        const data = await loginStore.im_GetSession();
        setSession(data);
        if (data.loggedIn) {
          setStatusMessage(
            `${data.displayName ?? data.email ?? "계정"}님 환영합니다.`
          );
          setErrorMessage(null);
          loginStore.im_Close();
          navigate("/");
        }
      } catch (error) {
        console.error(error);
      }
    },
    [loginStore, navigate]
  );

  useEffect(() => {
    void refreshSession();

    window.globalCallback_login = () => {
      void refreshSession();
    };

    const handleMessage = async (event: MessageEvent) => {
      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data === null
      ) {
        return;
      }
      const { type, accessToken } = event.data as {
        type?: string;
        accessToken?: string;
      };
      if (type === "google-login" && typeof accessToken === "string") {
        try {
          await loginStore.im_SaveGoogleToken(accessToken);
          await refreshSession();
        } catch (error) {
          console.error(error);
          setErrorMessage("구글 로그인에 실패했습니다.");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      delete window.globalCallback_login;
    };
  }, [loginStore, refreshSession]);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    loginStore.im_SetEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    loginStore.im_SetPassword(event.target.value);
  };

  const resolveErrorMessage = (error: unknown) => {
    const maybeAxios = error as {
      response?: { data?: { msg?: string } };
      message?: string;
    };
    return (
      maybeAxios?.response?.data?.msg ??
      maybeAxios?.message ??
      "요청 처리 중 오류가 발생했습니다."
    );
  };

  const validateFields = () => {
    if (!loginStore.pt_email.trim()) {
      setErrorMessage("이메일을 입력해주세요.");
      return false;
    }

    if (!loginStore.pt_password) {
      setErrorMessage("비밀번호를 입력해주세요.");
      return false;
    }

    if (loginStore.pt_password.length < 8) {
      setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (loginStore.pt_isSubmitting) return;

    if (!validateFields()) {
      return;
    }

    loginStore.im_SetSubmitting(true);

    try {
      const { err, exists } = await loginStore.im_CheckEmailExists(
        loginStore.pt_email
      );
      if (err) {
        throw new Error("이메일 확인 중 오류가 발생했습니다.");
      }

      if (exists) {
        const loginResult = await loginStore.im_Login({
          email: loginStore.pt_email,
          password: loginStore.pt_password,
        });
        if (loginResult.err) {
          throw new Error(loginResult.msg ?? "로그인에 실패했습니다.");
        }
        setStatusMessage("로그인되었습니다.");
        await refreshSession();
      } else {
        const displayName = loginStore.pt_email.includes("@")
          ? loginStore.pt_email.split("@")[0]
          : loginStore.pt_email;
        const signUpResult = await loginStore.im_SignUp({
          email: loginStore.pt_email,
          password: loginStore.pt_password,
          displayName,
        });
        if (signUpResult.err) {
          throw new Error(signUpResult.msg ?? "회원가입에 실패했습니다.");
        }
        setStatusMessage("회원가입이 완료되었습니다.");
        await refreshSession();
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      loginStore.im_SetSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { err } = await loginStore.im_Logout();
      if (err) {
        throw new Error("로그아웃에 실패했습니다.");
      }
      setSession({ loggedIn: false });
      loginStore.im_Open();
      setStatusMessage("로그아웃되었습니다.");
      setErrorMessage(null);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(resolveErrorMessage(error));
    }
  };

  return (
    <ReactModal
      isOpen={loginStore.pt_isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      className="login-modal"
      overlayClassName="login-overlay"
      contentLabel="로그인"
      aria={{ labelledby: "login-modal-title", describedby: subtitleId }}
    >
      <button
        type="button"
        className="login-modal__close"
        onClick={handleClose}
        aria-label="로그인 창 닫기"
      >
        <i className="bi bi-x-lg" aria-hidden="true" />
      </button>

      <header className="login-modal__header">        
        <h2 id="login-modal-title" className="login-modal__title">
          로그인
        </h2>
        <p id={subtitleId} className="login-modal__subtitle">
          Toon Studio 계정으로 접속하거나 구글 계정을 연동하세요.
        </p>
      </header>

      <div className="login-modal__actions">
        <SignUpSelectBtns is_signUp={false} p_state="login" />
      </div>

      <div className="login-modal__divider" role="separator">
        <span>또는</span>
      </div>

      <form className="login-modal__form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span className="login-field__label">이메일</span>
          <input
            type="email"
            name="email"
            placeholder="name@example.com"
            autoComplete="email"
            value={loginStore.pt_email}
            onChange={handleEmailChange}
          />
        </label>
        <label className="login-field">
          <span className="login-field__label">비밀번호</span>
          <input
            type="password"
            name="password"
            placeholder="8자 이상의 비밀번호"
          autoComplete="current-password"
          value={loginStore.pt_password}
          onChange={handlePasswordChange}
        />
      </label>
        {errorMessage && (
          <p className="login-feedback login-feedback--error">
            {errorMessage}
          </p>
        )}
        {statusMessage && (
          <p className="login-feedback login-feedback--status">
            {statusMessage}
          </p>
        )}
        <button
          type="submit"
          className="login-submit"
          disabled={loginStore.pt_isSubmitting}
        >
          {loginStore.pt_isSubmitting ? "처리 중..." : "이메일로 계속하기"}
        </button>
      </form>

      <footer className="login-modal__footer">
        {session?.loggedIn && (
          <button type="button" className="login-link" onClick={handleLogout}>
            로그아웃
          </button>
        )}
        <a href="/reset-password" className="login-link">
          비밀번호를 잊으셨나요?
        </a>
        <span className="login-modal__hint">
          처음 이용하시나요?{" "}
          <a href="/signup" className="login-link">
            회원가입
          </a>
        </span>
      </footer>
    </ReactModal>
  );
};

export default Login;
