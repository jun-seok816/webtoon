import React from 'react';

interface PanelTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const PanelTab: React.FC<PanelTabProps> = ({ label, isActive, onClick }) => {
  return (
    <div
      className={`panel-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

export default PanelTab;