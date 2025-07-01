import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const BASE_RGB_COLORS = {
  green: [0, 170, 0],
  yellow: [255, 170, 0],
  red: [255, 0, 0],
  default: [100, 100, 100]
};

// Helper function to interpolate between two colors
const interpolateColor = (color1, color2, factor) => {
  if (factor <= 0) return color1;
  if (factor >= 1) return color2;
  
  const result = color1.slice();
  for (let i = 0; i < 3; i += 1) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return result;
};

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

// Strictly check if value is within a range
const isInRange = (value, range) => {
  if (!range) return false;
  if (typeof range === 'object' && !Array.isArray(range)) {
    return value >= range.min && value <= range.max;
  }
  if (Array.isArray(range)) {
    return value >= range[0] && value <= range[1];
  }
  return false;
};

// Get the color for a value strictly following the thresholds
const getStrictColorForValue = (value, thresholds, parameterIndex = 0) => {
  if (!thresholds || value == null) return BASE_RGB_COLORS.default;

  const getThreshold = (type) => {
    if (!thresholds[type]) return null;
    return thresholds[type];
  };

  const greenRange = getThreshold('ideal');
  const yellowRange = getThreshold('moderate');
  const extreme = getThreshold('extreme');
  const extremeRanges = getExtremeRanges(extreme);

  if (greenRange && isInRange(value, greenRange)) return BASE_RGB_COLORS.green;
  if (yellowRange && isInRange(value, yellowRange)) return BASE_RGB_COLORS.yellow;
  if (extremeRanges.some(r => isInRange(value, r))) return BASE_RGB_COLORS.red;

  return BASE_RGB_COLORS.default;
};

// Get the color for a value with smooth transitions between zones
const getSmoothColorForValue = (value, thresholds = {}, parameterIndex = 0) => {
  const getThreshold = (type) => {
    if (!thresholds[type]) return null;
    return thresholds[type];
  };

  const greenRange = getThreshold('ideal') || { min: 0, max: 0 };
  const yellowRange = getThreshold('moderate') || { min: 0, max: 0 };
  const extreme = getThreshold('extreme') || { min: 0, max: 0 };
  const extremeRanges = getExtremeRanges(extreme);

  // First try to get strict color
  try {
    const strictColor = getStrictColorForValue(value, thresholds, parameterIndex);
    if (strictColor !== BASE_RGB_COLORS.default) return strictColor;
  } catch (e) {
    return BASE_RGB_COLORS.default;
  }

  // For values between zones, calculate transition color
  try {
    // Between green and yellow
    if (value > greenRange.max && value < yellowRange.min) {
      const factor = (value - greenRange.max) / (yellowRange.min - greenRange.max);
      return interpolateColor(BASE_RGB_COLORS.green, BASE_RGB_COLORS.yellow, factor);
    }
    // Between yellow and lower extreme
    if (value > yellowRange.max && value < extremeRanges[1]?.min) {
      const factor = (value - yellowRange.max) / (extremeRanges[1].min - yellowRange.max);
      return interpolateColor(BASE_RGB_COLORS.yellow, BASE_RGB_COLORS.red, factor);
    }
    // Between upper extreme and yellow (for values below green)
    if (value < greenRange.min && value > yellowRange.max) {
      const factor = (greenRange.min - value) / (greenRange.min - yellowRange.max);
      return interpolateColor(BASE_RGB_COLORS.yellow, BASE_RGB_COLORS.green, factor);
    }
    // Between lower extreme and yellow (for values below yellow)
    if (value < yellowRange.min && value > extremeRanges[0]?.max) {
      const factor = (yellowRange.min - value) / (yellowRange.min - extremeRanges[0].max);
      return interpolateColor(BASE_RGB_COLORS.red, BASE_RGB_COLORS.yellow, factor);
    }
  } catch (e) {
    console.error('Error calculating smooth color:', e);
  }

  return BASE_RGB_COLORS.default;
};

const getColorWithAlpha = (rgbArray, alpha = 0.8) => `rgba(${rgbArray.join(', ')}, ${alpha})`;

const parseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  try {
    return new Date(timestamp);
  } catch (e) {
    return null;
  }
};

const formatTimeLabel = (date) => {
  if (!date) return 'N/A';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const TimeSeriesChart = ({ 
  title, 
  data, 
  parameterIndex = 0,
  ranges 
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!Array.isArray(data)) {
      console.log('Invalid data format:', data);
      return;
    }

    // Transform and sort data
    const transformedData = data.map(entry => ({
      Timestamp: entry.timestamp,
      [title]: entry.value,
      ranges: entry.ranges || ranges
    }))
    .filter(entry => entry.Timestamp && entry[title] !== undefined)
    .map(entry => ({
      ...entry,
      date: parseTimestamp(entry.Timestamp)
    }))
    .filter(entry => entry.date)
    .sort((a, b) => a.date - b.date);

    if (transformedData.length === 0) {
      console.log('No valid data points after filtering');
      return;
    }

    // Get the last 29 data points (24 hours + 5 points)
    const now = new Date();
    const startTime = new Date(now.getTime() - (30 * 60 * 60 * 1000));
    const filteredData = transformedData.filter(entry => entry.date >= startTime);
    const finalData = filteredData.length > 29 ? filteredData.slice(-29) : filteredData;

    const labels = finalData.map(entry => entry.Timestamp);
    const values = finalData.map(entry => entry[title]);

    // Calculate 6 time labels at 6-hour intervals
    const timeLabels = [];
    const latestDate = finalData.length > 0 ? finalData[finalData.length - 1].date : now;
    const earliestDate = finalData.length > 0 ? finalData[0].date : new Date(latestDate.getTime() - (24 * 60 * 60 * 1000));
    
    // Calculate the total time span in hours
    const totalHours = (latestDate.getTime() - earliestDate.getTime()) / (60 * 60 * 1000);
    const interval = Math.max(6, Math.floor(totalHours / 4));
    
    // Generate labels
    for (let i = 0; i <= 4; i += 1) {
      const time = new Date(latestDate.getTime() - (i * interval * 60 * 60 * 1000));
      if (time >= earliestDate) {
        timeLabels.unshift(time);
      }
    }

    // Use ranges from the first valid data point if available
    const thresholds = finalData[0]?.ranges || ranges;

    const calculateRoundedLowerLimit = () => {
      const validValues = values.filter(v => v !== null && !Number.isNaN(v));
      if (!validValues.length) return 0;
      
      const minValue = Math.min(...validValues);
      if (!Number.isFinite(minValue)) return 0;
      
      let roundedValue;
      const absMin = Math.abs(minValue);
      
      if (absMin < 1) roundedValue = Math.floor(minValue * 100) / 100 - 0.01;
      else if (absMin < 10) roundedValue = Math.floor(minValue * 10) / 10 - 0.1;
      else roundedValue = Math.floor(minValue) - 1;
      
      if (minValue >= 0 && roundedValue < 0) return 0;
      
      const maxValue = Math.max(...validValues);
      const range = maxValue - roundedValue;
      return roundedValue - range * 0.05;
    };

    const calculateRoundedUpperLimit = () => {
      const validValues = values.filter(v => v !== null && !Number.isNaN(v));
      if (!validValues.length) return 100;
      
      const maxValue = Math.max(...validValues);
      if (!Number.isFinite(maxValue)) return 100;
      
      let roundedValue;
      const absMax = Math.abs(maxValue);
      
      if (absMax < 1) roundedValue = Math.ceil(maxValue * 100) / 100 + 0.01;
      else if (absMax < 10) roundedValue = Math.ceil(maxValue * 10) / 10 + 0.1;
      else roundedValue = Math.ceil(maxValue) + 1;
      
      const minValue = Math.min(...validValues);
      const range = roundedValue - minValue;
      return roundedValue + range * 0.05;
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    const yAxisMin = calculateRoundedLowerLimit();
    const yAxisMax = calculateRoundedUpperLimit();
    const stepSize = (yAxisMax - yAxisMin) / 5;

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          borderColor: `rgba(${BASE_RGB_COLORS.default.join(', ')}, 0.8)`,
          backgroundColor: 'transparent',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: (context) => {
            const value = context.parsed?.y;
            return value != null 
              ? `rgb(${getStrictColorForValue(value, thresholds, parameterIndex).join(', ')})`
              : `rgb(${BASE_RGB_COLORS.default.join(', ')})`;
          },
          pointBorderColor: (context) => {
            const value = context.parsed?.y;
            return value != null 
              ? `rgb(${getStrictColorForValue(value, thresholds, parameterIndex).join(', ')})`
              : `rgb(${BASE_RGB_COLORS.default.join(', ')})`;
          },
          pointBorderWidth: 1,
          segment: {
            borderColor: (context) => {
              if (!context.p0?.parsed || !context.p1?.parsed) return getColorWithAlpha(BASE_RGB_COLORS.default);
              
              // Calculate the number of steps based on the distance between points
              const xDist = Math.abs(context.p1.x - context.p0.x);
              const yDist = Math.abs(context.p1.parsed.y - context.p0.parsed.y);
              const steps = Math.max(5, Math.min(20, Math.sqrt(xDist * xDist + yDist * yDist) / 2));
              
              // Create gradient with multiple color stops
              const gradient = context.chart.ctx.createLinearGradient(context.p0.x, context.p0.y, context.p1.x, context.p1.y);
              
              for (let i = 0; i <= steps; i += 1) {
                const factor = i / steps;
                const interpValue = context.p0.parsed.y + (context.p1.parsed.y - context.p0.parsed.y) * factor;
                const color = getSmoothColorForValue(interpValue, thresholds, parameterIndex);
                gradient.addColorStop(factor, getColorWithAlpha(color));
              }
              
              return gradient;
            }
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          onComplete: () => {
            if (chartInstance.current) {
              chartInstance.current.update();
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { 
            mode: 'index', 
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value !== null ? value.toFixed(2) : 'N/A'}`;
              },
              title: (context) => {
                const timestamp = context[0].label;
                const date = parseTimestamp(timestamp);
                return date ? date.toLocaleString() : 'N/A';
              }
            }
          },
          datalabels: { display: false },
          annotation: { annotations: [] }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Time (24h)' },
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 6,
              font: { size: 10 },
              callback: (val) => {
                const date = parseTimestamp(labels[val]);
                return date ? formatTimeLabel(date) : '';
              }
            }
          },
          y: {
            beginAtZero: false,
            grid: { color: '#eeeeee', lineWidth: 1, drawBorder: false },
            min: yAxisMin,
            max: yAxisMax,
            ticks: { stepSize }
          }
        }
      }
    });

    // eslint-disable-next-line consistent-return
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [title, data, ranges, parameterIndex]);

  return <div style={{ width: '100%', height: '90%', marginTop: '25px' }}><canvas ref={chartRef} /></div>;
};

export default TimeSeriesChart;