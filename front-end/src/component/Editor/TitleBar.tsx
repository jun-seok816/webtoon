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
    </header>
  );
};

export default TitleBar;
