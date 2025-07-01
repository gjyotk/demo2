import React from 'react';

const SensorStatsDisplay = ({ title, metrics, unit }) => (
  <div className="stats-display" style={{ 
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
    width: '100%',
    padding: '8px 0'
  }}>
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: 'rgba(240, 240, 240, 0.5)',
      borderRadius: '6px'
    }}>
      <span style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.75em' }}>Min</span>
      <span style={{ fontWeight: '600', fontSize: '0.9em' }}>
        {metrics[title]?.min} <small style={{ opacity: 0.7, fontSize: '0.7em' }}>{unit}</small>
      </span>
    </div>
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: 'rgba(240, 240, 240, 0.5)',
      borderRadius: '6px'
    }}>
      <span style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.75em' }}>Max</span>
      <span style={{ fontWeight: '600', fontSize: '0.9em' }}>
        {metrics[title]?.max} <small style={{ opacity: 0.7, fontSize: '0.7em' }}>{unit}</small>
      </span>
    </div>
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: 'rgba(240, 240, 240, 0.5)',
      borderRadius: '6px'
    }}>
      <span style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.75em' }}>Avg</span>
      <span style={{ fontWeight: '600', fontSize: '0.9em' }}>
        {metrics[title]?.avg} <small style={{ opacity: 0.7, fontSize: '0.7em' }}>{unit}</small>
      </span>
    </div>
  </div>
);

export default SensorStatsDisplay;