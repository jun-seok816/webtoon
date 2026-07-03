import React from "react";
import { Editor } from "./Layout";
import "./TitleBar.scss";

interface TitleBarProps {
  editor: Editor;
}

const TitleBar: React.FC<TitleBarProps> = ({ editor }) => {
  void editor;
  return (
    <header className="title-bar">
      <div className="title-bar__brand">
        <span className="brand-indicator" />
        Toon Studio
      </div>
      <div className="title-bar__actions">
        <a
          className="title-bar__github"
          href="https://github.com/jun-seok816/webtoon"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub 저장소 열기"
          title="GitHub 저장소"
        >
          <i className="bi bi-github" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
};

export default TitleBar;
