import { Loading } from "@jsLib/class/Loading";
import { ImageItem, Upload } from "@jsLib/class/Upload";
import React from "react";
import "./WebtoonUplaod.scss";
import throttle from "lodash/throttle";

export default function WebtoonUploadPage(props: {
  lv_Obj: Upload;
  Loading: Loading;
}) {
  async function makeThumbnail(file: File, maxSide = 2000): Promise<Blob> {
    const bmp = await createImageBitmap(file);
    let { width, height } = bmp;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    if (scale < 1) {
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0, width, height);
    const blob: Blob = await new Promise(
      (res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85)!
    );
    bmp.close();
    return blob;
  }
  const throttledRender = throttle(() => {
    props.lv_Obj.im_forceRender();
  }, 100);
  async function AddFiles(files: File[]) {
    const total = files.filter((f) => f.type.startsWith("image/")).length;
    let completed = 0;
    props.Loading.is_loading = true;
    props.lv_Obj.im_forceRender();
    try {
      const next = await Promise.all(
        files
          .filter((f) => f.type.startsWith("image/"))
          .map((file, i) => {
            return new Promise<ImageItem>((resolve, reject) => {
              const id =
                globalThis.crypto?.randomUUID?.() ??
                `${Date.now()}-${Math.random()}-${i}`;

              const fr = new FileReader();

              fr.onprogress = (e) => {
                // if (e.lengthComputable) {
                //   const percent = Math.round((e.loaded / e.total) * 100);
                //   if (total === 1) {
                //     props.Loading.iv_per = percent;
                //     throttledRender();
                //   }
                //   console.log(`${file.name} 읽는 중: ${percent}%`);
                // }
              };

              fr.onload = async () => {
                completed++;
                console.log(`진행도: ${completed}/${total} 완료`);
                props.Loading.iv_per = Math.round((completed / total) * 100); // ← 0~100으로
                throttledRender();
                const thumbBlob = await makeThumbnail(file);
                const previewUrl = URL.createObjectURL(thumbBlob);
                resolve({
                  id,
                  file,
                  previewUrl: previewUrl,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                });
              };

              fr.onerror = reject;

              fr.readAsDataURL(file);
            });
          })
      );
      props.lv_Obj.pt_items = [...props.lv_Obj.pt_items, ...next];
    } catch (err) {
      console.log(err);
    } finally {
      props.Loading.iv_per = 0;
      props.Loading.is_loading = false;
      props.lv_Obj.im_forceRender();
    }
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) AddFiles(files);
    e.target.value = "";
  };
  return (
    <section id="rubghwgrnnn2323">
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
                <input
                  id="title"
                  name="title"
                  placeholder="제목을 입력하세요"
                />
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
                onChange={onSelect}
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
          <section
            className="panel panel--queue"
            aria-labelledby="queue-heading"
          >
            <h2 id="queue-heading" className="panel__title">
              페이지 정렬
            </h2>

            <div className="queue scroll">
              <ul className="queue__list" role="list">
                {props.lv_Obj.pt_items.map((it, idx) => (
                  <li key={it.id} className="queue-item">
                    <div className="queue-item__thumb">
                      <img
                        src={it.previewUrl}
                        alt={it.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    </div>
                    <div className="queue-item__meta">
                      <div className="queue-item__name">
                        {String(idx + 1).padStart(3, "0")} · {it.name}
                      </div>
                      <div className="queue-item__sub">
                        {(it.size / 1024 / 1024).toFixed(2)}MB · {it.type}
                      </div>
                    </div>
                    <div className="queue-item__controls">
                      <button
                        className="icon-btn"
                        onClick={() => props.lv_Obj.im_Move(it.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => props.lv_Obj.im_Move(it.id, +1)}
                      >
                        ↓
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => props.lv_Obj.im_Remove(it.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 사이드바 (미리보기) */}
          <aside
            className="panel panel--sidebar"
            aria-labelledby="sidebar-heading"
          >
            <h2 id="sidebar-heading" className="panel__title">
              미리보기
            </h2>

            <div className="preview">
              <div
                className="preview__stage scroll"
                role="img"
                aria-label="선택한 페이지 미리보기 영역"
              >
                {props.lv_Obj.pt_items.length === 0 ? (
                  <>
                    <div className="preview__placeholder">미리보기</div>
                  </>
                ) : (
                  <>
                    {props.lv_Obj.pt_items.map((it, idx) => {
                      return (
                        <img
                          key={`${idx}-image-preivew`}
                          src={it.previewUrl}
                          style={{
                            width: "100%",
                            objectFit: "contain",
                          }}
                        />
                      );
                    })}
                  </>
                )}
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
    </section>
  );
}
