import { Loading } from "@jsLib/class/Loading";
import React from "react";
import "./LoadingScreen.scss";

export default function LoadingScreen(props:{Loading:Loading}) {
  return (
    <div className={`loading ${!props.Loading.is_loading?"is-hidden":""}`} aria-busy="true" role="dialog" aria-modal="true">
      <div className="loading__backdrop" />
      <div className="loading__panel" role="status" aria-live="polite">
        <div className="loading__spinner" aria-hidden="true">
          <svg className="ring" viewBox="0 0 48 48">
            <circle className="ring__bg" cx="24" cy="24" r="20" />
            <circle className="ring__fg" cx="24" cy="24" r="20" />
          </svg>
        </div>

        <h2 className="loading__title">처리 중…</h2>
        <p className="loading__desc">잠시만 기다려 주세요.</p>

        <div className="loading__progress" role="progressbar">
          <div className="loading__bar" style={{ width: `${props.Loading.iv_per}%` }} />
          <span className="loading__label">{props.Loading.iv_per}%</span>
        </div>

        <button type="button" className="loading__cancel" aria-label="취소">
          취소
        </button>
      </div>
    </div>
  );
}
