import React from "react";

const menuItems = [
  "File",
  "Edit",  
];

const MenuBar: React.FC = () => {
  return (
    <nav className="menu-bar">
      <div className="menu-bar__group">
        {menuItems.map((item) => (
          <button key={item} className="menu-item">
            {item}
          </button>
        ))}
      </div>
      <div className="menu-bar__workspace">
        <span className="workspace-label">Workspace:</span>
        <select defaultValue="toon-compositing">
          <option value="toon-compositing">Toon Compositing</option>
          <option value="layout">Layout</option>
          <option value="color">Color</option>
        </select>
        <button className="menu-icon" title="Customize workspace">
          <i className="bi bi-columns-gap" aria-hidden="true" />
        </button>
        <button className="menu-icon" title="Search commands">
          <i className="bi bi-search" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default MenuBar;
