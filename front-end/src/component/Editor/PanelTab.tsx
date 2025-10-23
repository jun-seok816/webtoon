import React from "react";

interface PanelTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: string;
}

const PanelTab: React.FC<PanelTabProps> = ({ label, isActive, onClick, icon }) => {
  return (
    <button
      type="button"
      className={`panel-tab ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      {icon && <i className={`bi ${icon}`} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
};

export default PanelTab;
