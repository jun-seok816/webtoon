import React from "react";
import "./EditorUI.scss";

export default function EditorUI() {
  return (
    <section id="ihnewrjkj23">
      <div className="editor">
        {/* 상단 툴바 */}
        <header className="toolbar">
          <div className="toolbar__left">
            <button className="icon-btn" aria-label="Menu">
              ☰
            </button>
            <div className="toolbar__brand">Manga Studio Pro</div>
            <div className="toolbar__group">
              <button className="btn btn--ghost">File</button>
              <button className="btn btn--ghost">Edit</button>
              <button className="btn btn--ghost">View</button>
              <button className="btn btn--ghost">Window</button>
            </div>
          </div>

          <div className="toolbar__center">
            <div className="search">
              <input placeholder="Search commands…" />
            </div>
          </div>

          <div className="toolbar__right">
            <div className="toolbar__group">
              <button className="btn btn--primary">Export</button>
              <button className="icon-btn" aria-label="Help">
                ?
              </button>
            </div>
          </div>
        </header>

        {/* 좌측 도구패널 */}
        <aside className="tools">
          <div className="toolset">
            <button className="tool is-active" title="Select">
              ⟐
            </button>
            <button className="tool" title="Text">
              T
            </button>
            <button className="tool" title="Eraser">
              ⌫
            </button>
            <button className="tool" title="Balloon">
              ◯
            </button>
            <button className="tool" title="Pen">
              ✎
            </button>
            <button className="tool" title="Shape">
              ▭
            </button>
            <button className="tool" title="Hand">
              ✋
            </button>
            <button className="tool" title="Zoom">
              🔍
            </button>
          </div>

          <div className="toolset toolset--secondary">
            <label className="tool-toggle">
              <input type="checkbox" />
              <span>Snap</span>
            </label>
            <label className="tool-toggle">
              <input type="checkbox" defaultChecked />
              <span>Guides</span>
            </label>
          </div>
        </aside>

        {/* 중앙 캔버스 */}
        <main className="stage">
          <div className="page">
            <div className="page__inner">
              {/* 실제 이미지는 <img/> 또는 캔버스 붙이면 됨 */}
              <div className="mock-manga">
                <div className="bubble bubble--left">HEY, YOU THERE!!</div>
                <div className="bubble bubble--right">
                  COULD THAT BE THE SWORD?
                </div>
              </div>
            </div>
          </div>

          <div className="pager">
            <button className="btn btn--ghost">◀</button>
            <span>Page 1 / 5</span>
            <button className="btn btn--ghost">▶</button>
            <div className="spacer" />
            <button className="btn btn--ghost">Fit</button>
            <button className="btn btn--ghost is-active">100%</button>
            <button className="btn btn--ghost">200%</button>
          </div>
        </main>

        {/* 우측 속성패널 */}
        <aside className="props">
          <div className="panel">
            <div className="tabs">
              <button className="tab is-active">Text</button>
              <button className="tab">Auto-Translate</button>
              <button className="tab">Layer</button>
            </div>

            <div className="panel__section">
              <label className="field">
                <span className="field__label">Font</span>
                <select className="field__control">
                  <option>Akzidenz Grotesk</option>
                  <option>Inter</option>
                  <option>Roboto</option>
                </select>
              </label>

              <div className="grid grid--2">
                <label className="field">
                  <span className="field__label">Weight</span>
                  <select className="field__control">
                    <option>Regular</option>
                    <option>Medium</option>
                    <option>Bold</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Size</span>
                  <input
                    className="field__control"
                    type="number"
                    defaultValue={16}
                  />
                </label>
              </div>

              <div className="field field--row">
                <span className="field__label">Color</span>
                <button className="swatch" />
                <label className="toggle">
                  <input type="checkbox" />
                  <span>Outline</span>
                </label>
              </div>

              <div className="field field--row">
                <span className="field__label">Balloon</span>
                <button className="btn btn--ghost">Style</button>
                <button className="btn btn--ghost">Tail</button>
                <button className="btn btn--ghost">Padding</button>
              </div>
            </div>

            <div className="panel__section">
              <div className="panel__title">Page</div>
              <div className="grid grid--2">
                <label className="field">
                  <span className="field__label">Bleed</span>
                  <input className="field__control" placeholder="3 mm" />
                </label>
                <label className="field">
                  <span className="field__label">DPI</span>
                  <input className="field__control" placeholder="600" />
                </label>
              </div>
              <button className="btn btn--primary btn--block">Download</button>
            </div>
          </div>
        </aside>

        {/* 하단 상태바 */}
        <footer className="statusbar">
          <div>Ready</div>
          <div className="statusbar__sep" />
          <div>Doc: Untitled.manga</div>
          <div className="statusbar__sep" />
          <div>GPU Accel On</div>
        </footer>
      </div>
    </section>
  );
}
