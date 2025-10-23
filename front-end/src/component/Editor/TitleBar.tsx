import React from "react";

interface TitleBarProps {
  documentName: string;
  zoom: number;
}

const TitleBar: React.FC<TitleBarProps> = ({ documentName, zoom }) => {
  return (
    <header className="title-bar">
      <div className="title-bar__brand">
        <span className="brand-indicator" />
        Toon Studio
      </div>
      <div className="title-bar__document">
        {documentName} @ {zoom}% (RGB/8)
      </div>
    </header>
  );
};

export default TitleBar;
