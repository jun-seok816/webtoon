import React from 'react';

const MenuBar: React.FC = () => {
  return (
    <nav className="menu-bar">
      <a href="#" className="menu-item">File</a>
      <a href="#" className="menu-item">Edit</a>
      <a href="#" className="menu-item">Image</a>
      <a href="#" className="menu-item">Layer</a>
      <a href="#" className="menu-item">Select</a>
      <a href="#" className="menu-item">Filter</a>
      <a href="#" className="menu-item">View</a>
      <a href="#" className="menu-item">Window</a>
      <a href="#" className="menu-item">Help</a>
    </nav>
  );
};

export default MenuBar;