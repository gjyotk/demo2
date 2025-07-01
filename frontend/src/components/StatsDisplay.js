import React, { useEffect, useState } from 'react';

const COLORS = { green: '#00AA00', yellow: '#FFAA00', red: '#FF0000', gray: '#666666' };

// Helper to split extreme range into two
const getExtremeRanges = (extreme) => {
  if (!extreme || typeof extreme !== 'object' || extreme.min === undefined || extreme.max === undefined) {
    return [];
  }
  return [
    { min: -Infinity, max: extreme.min }, // Lower extreme
    { min: extreme.max, max: Infinity }   // Upper extreme
  ];
};

// Updated helper function to work with {min, max} format
const isInRange = (value, range) => {
  if (!range || typeof range !== 'object') return false;
  if (range.min === undefined || range.max === undefined) return false;
  return value >= range.min && value <= range.max;
};

const getValueColor = (value, ranges) => {
  if (value == null || Number.isNaN(value) || !ranges) return COLORS.gray;

  const idealRange = ranges.ideal;
  const moderateRange = ranges.moderate;
  // eslint-disable-next-line prefer-destructuring
  const extreme = ranges.extreme;
  const extremeRanges = getExtremeRanges(extreme);

  if (idealRange && isInRange(value, idealRange)) return COLORS.green;
  if (moderateRange && isInRange(value, moderateRange)) return COLORS.yellow;
  if (extremeRanges.some(r => isInRange(value, r))) return COLORS.red;

  return COLORS.gray;
};

const StatsDisplay = ({ title, value, unit, ranges, currentValue }) => {
  const [isMounted, setIsMounted] = useState(false);
  const textColor = getValueColor(
    typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue, 
    ranges
  );

  useEffect(() => { setIsMounted(true); return () => setIsMounted(false); }, []);

  const getIndicatorPosition = (color) => {
    if (color === COLORS.green) return '0%';
    if (color === COLORS.red) return '100%';
    if (color === COLORS.yellow) return '50%';
    return '0%';
  };

  const indicatorPos = getIndicatorPosition(textColor);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 8px', marginBottom: '28px' }}>
        <div style={{ marginBottom: '0px', color: textColor, fontWeight: 'bold', fontSize: '1.8em' }}>
          {value !== undefined ? value : '--'}
        </div>
        <div style={{ fontSize: '1em', color: '#666666' }}>{unit}</div>
      </div>

      {isMounted && (
        <>
          <div style={{
            position: 'absolute', bottom: '16px', left: '5%', right: '5%', height: '6px',
            background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.yellow}, ${COLORS.red})`,
            borderRadius: '3px',
          }}>
            <div style={{
              position: 'absolute', left: indicatorPos, transform: 'translate(-50%, -100%)',
              width: '0', height: '0', borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent', borderTop: '10px solid black', top: '0%', zIndex: 1
            }} />
          </div>

          <div style={{
            position: 'absolute', bottom: '0px', left: '5%', right: '5%',
            display: 'flex', justifyContent: 'space-between', fontSize: '0.55em', color: '#555',
          }}>
            <span style={{ transform: 'translateX(-50%)' }}>Ideal</span>
            <span>Moderate</span>
            <span style={{ transform: 'translateX(22%)' }}>Extreme</span>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsDisplay;