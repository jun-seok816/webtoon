import React, { useState } from 'react';

const ToolsPanel: React.FC = () => {
  const [activeTool, setActiveTool] = useState('move');

  return (
    <div className="tools-panel">
      <button 
        className={`tool-button ${activeTool === 'move' ? 'active' : ''}`}
        onClick={() => setActiveTool('move')}
        title="Move Tool (V)"
      >[M]</button>
      <button 
        className={`tool-button ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => setActiveTool('select')}
        title="Marquee Tool (M)"
      >[S]</button>
      <button 
        className={`tool-button ${activeTool === 'lasso' ? 'active' : ''}`}
        onClick={() => setActiveTool('lasso')}
        title="Lasso Tool (L)"
      >[L]</button>
      <button 
        className={`tool-button ${activeTool === 'crop' ? 'active' : ''}`}
        onClick={() => setActiveTool('crop')}
        title="Crop Tool (C)"
      >[C]</button>
      <button 
        className={`tool-button ${activeTool === 'brush' ? 'active' : ''}`}
        onClick={() => setActiveTool('brush')}
        title="Brush Tool (B)"
      >[B]</button>
      <button 
        className={`tool-button ${activeTool === 'eraser' ? 'active' : ''}`}
        onClick={() => setActiveTool('eraser')}
        title="Eraser Tool (E)"
      >[E]</button>
      <button 
        className={`tool-button ${activeTool === 'text' ? 'active' : ''}`}
        onClick={() => setActiveTool('text')}
        title="Text Tool (T)"
      >[T]</button>
      <button 
        className={`tool-button ${activeTool === 'zoom' ? 'active' : ''}`}
        onClick={() => setActiveTool('zoom')}
        title="Zoom Tool (Z)"
      >[Z]</button>
      {/* ... 더 많은 툴 버튼 ... */}
    </div>
  );
};

export default ToolsPanel;