import React from 'react';

const OptionsBar: React.FC = () => {
  return (
    <div className="options-bar">
      <label htmlFor="mode">Mode:</label>
      <select id="mode">
        <option value="normal">Normal</option>
        <option value="multiply">Multiply</option>
        <option value="screen">Screen</option>
      </select>

      <label htmlFor="opacity">Opacity:</label>
      <input type="text" id="opacity" defaultValue="100%" style={{ width: '60px' }} />

      <label htmlFor="size">Size:</label>
      <input type="text" id="size" defaultValue="10px" style={{ width: '50px' }} />

      <button>Brush Settings</button>
      {/* 선택된 툴에 따라 동적으로 바뀌는 옵션들 */}
    </div>
  );
};

export default OptionsBar;