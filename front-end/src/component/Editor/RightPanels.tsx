import React, { useState } from 'react';
import PanelTab from './PanelTab';

const RightPanels: React.FC = () => {
  const [activeTab, setActiveTab] = useState('layers'); // 'layers', 'properties', 'history'

  return (
    <div className="right-panels">
      <div className="panel-tabs">
        <PanelTab label="Layers" isActive={activeTab === 'layers'} onClick={() => setActiveTab('layers')} />
        <PanelTab label="Properties" isActive={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
        <PanelTab label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
      </div>
      <div className="panel-content">
        {activeTab === 'layers' && (
          <div className="panel-section">
            <h3>Layers</h3>
            <div className="row">
              <label>Opacity</label>
              <input type="text" defaultValue="100%" />
            </div>
            <div className="row">
              <label>Fill</label>
              <input type="text" defaultValue="100%" />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
              Layer 1 (Background)<br/>Layer 2 (Text)<br/>Layer 3 (Shape)
            </p>
          </div>
        )}
        {activeTab === 'properties' && (
          <div className="panel-section">
            <h3>Properties</h3>
            <div className="row">
              <label>Width</label>
              <input type="text" defaultValue="1920px" />
            </div>
            <div className="row">
              <label>Height</label>
              <input type="text" defaultValue="1080px" />
            </div>
            <div className="row">
              <label>Resolution</label>
              <input type="text" defaultValue="72 dpi" />
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="panel-section">
            <h3>History</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ color: 'var(--muted)', marginBottom: '0.4rem' }}>Open Document</li>
              <li style={{ color: 'var(--muted)', marginBottom: '0.4rem' }}>Add Layer</li>
              <li style={{ color: 'var(--muted)', marginBottom: '0.4rem' }}>Brush Stroke</li>
              <li style={{ color: 'var(--text)', fontWeight: 'bold' }}>Text Tool</li>
              <li style={{ color: 'var(--muted)', marginBottom: '0.4rem' }}>Move Layer</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanels;