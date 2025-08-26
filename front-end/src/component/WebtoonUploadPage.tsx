import React from "react";
import "./WebtoonUplaod.scss";

export default function WebtoonUploadPage() {
  return (
    <div className="webtoon-upload">
      <header className="webtoon-upload__header" role="banner">
        <h1 className="webtoon-upload__title">웹툰 이미지 업로드</h1>

        <div className="webtoon-upload__actions">          
          <button type="button" className="btn btn--primary">
            업로드
          </button>
        </div>
      </header>

      <main className="webtoon-upload__main" role="main">
        {/* 메타 정보 */}
        <section className="panel panel--meta" aria-labelledby="meta-heading">
          <h2 id="meta-heading" className="panel__title">
            메타 정보
          </h2>

          <form
            className="form form--grid"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="form__field form__field--wide">
              <label htmlFor="title">제목</label>
              <input id="title" name="title" placeholder="제목을 입력하세요" />
            </div>
          </form>
        </section>

        {/* 업로드 드롭존 */}
        <section
          className="panel panel--dropzone"
          aria-labelledby="dropzone-heading"
        >
          <h2 id="dropzone-heading" className="panel__title">
            이미지 추가
          </h2>

          <div className="dropzone" aria-label="이미지 드래그 앤 드롭 영역">
            <input
              id="file-input"
              className="dropzone__input"
              type="file"
              accept="image/*"
              multiple
              aria-label="이미지 파일 선택"
            />
            <label htmlFor="file-input" className="dropzone__surface">
              <span className="dropzone__icon" aria-hidden="true">
                {/* 간단한 인라인 아이콘 */}
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 16V4m0 0l-4 4m4-4l4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="14"
                    width="18"
                    height="6"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
              <span className="dropzone__text">
                이미지를 이곳에 드래그하거나 <strong>파일 선택</strong>을
                누르세요
                <small className="dropzone__hint">
                  JPEG, PNG, WEBP / 다중 선택 가능
                </small>
              </span>
            </label>
          </div>
        </section>

        {/* 업로드 대기열 / 정렬 */}
        <section className="panel panel--queue" aria-labelledby="queue-heading">
          <h2 id="queue-heading" className="panel__title">
            페이지 정렬
          </h2>

          <div className="queue">
            <ul className="queue__list" role="list">
              {/* 샘플 아이템 (로직 없이 구조만) */}
              <li className="queue-item" draggable>
                <div className="queue-item__thumb" aria-hidden="true" />
                <div className="queue-item__meta">
                  <div className="queue-item__name">page_001.png</div>
                  <div className="queue-item__sub">1024×4096 · 1.2MB</div>
                </div>
                <div className="queue-item__controls" aria-label="정렬 컨트롤">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="위로 이동"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="아래로 이동"
                  >
                    ↓
                  </button>
                  <button type="button" className="icon-btn" aria-label="삭제">
                    ✕
                  </button>
                </div>
              </li>

              <li className="queue-item" draggable>
                <div className="queue-item__thumb" aria-hidden="true" />
                <div className="queue-item__meta">
                  <div className="queue-item__name">page_002.png</div>
                  <div className="queue-item__sub">1024×4096 · 1.1MB</div>
                </div>
                <div className="queue-item__controls" aria-label="정렬 컨트롤">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="위로 이동"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="아래로 이동"
                  >
                    ↓
                  </button>
                  <button type="button" className="icon-btn" aria-label="삭제">
                    ✕
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* 사이드바 (미리보기 & 옵션) */}
        <aside
          className="panel panel--sidebar"
          aria-labelledby="sidebar-heading"
        >
          <h2 id="sidebar-heading" className="panel__title">
            미리보기 & 옵션
          </h2>

          <div className="preview">
            <div
              className="preview__stage"
              role="img"
              aria-label="선택한 페이지 미리보기 영역"
            >
              <div className="preview__placeholder">미리보기</div>
            </div>
          </div>
            
        </aside>
      </main>

      <footer className="webtoon-upload__footer" role="contentinfo">        
        <div className="footer__right">          
          <button type="button" className="btn btn--primary">
            업로드
          </button>
        </div>
      </footer>
    </div>
  );
}
