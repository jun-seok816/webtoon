import React, { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactModal from "react-modal";
import { Main } from "@jsLib/class/Main_class";
import { LoginModalState } from "@jsLib/class/Login";
import SignUpSelectBtns from "./SignUp_select_btns";
import "./Login.scss";

if (typeof document !== "undefined") {
  ReactModal.setAppElement("#app");
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [main] = useState(() => new Main());
  const [loginStore] = useState(
    () => new LoginModalState(main.im_forceRender.bind(main))
  );

  main.im_Prepare_Hooks();
  main.im_Mounted(() => {
    loginStore.im_ResetFields();
    loginStore.im_SetSubmitting(false);
    loginStore.im_Open();
  });

  const subtitleId = useId();

  const handleClose = () => {
    loginStore.im_Close();
    navigate("/");
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    loginStore.im_SetEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    loginStore.im_SetPassword(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginStore.pt_isSubmitting) return;
    loginStore.im_SetSubmitting(true);

    // TODO: 실제 인증 로직 연동
    setTimeout(() => {
      loginStore.im_SetSubmitting(false);
      loginStore.im_Close();
      navigate("/");
    }, 300);
  };

  return (
    <ReactModal
      isOpen={loginStore.pt_isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
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
        <button
          type="submit"
          className="login-submit"
          disabled={loginStore.pt_isSubmitting}
        >
          이메일로 계속하기
        </button>
      </form>

      <footer className="login-modal__footer">
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
