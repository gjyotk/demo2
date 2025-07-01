import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart } from 'chart.js/auto';
import { FaPlusCircle, FaInfoCircle } from 'react-icons/fa';
import SensorStatsDisplay from './SensorStatsDisplay';
import { axiosAuthInstance } from '../services/axiosConfig';
import aqIcon from '../assets/icons/aq.png';
import weIcon from '../assets/icons/we.png';
import wdIcon from '../assets/icons/wd.png';
import wfIcon from '../assets/icons/wf.png';
import slIcon from '../assets/icons/sl.png';
import wnIcon from '../assets/icons/wn.png';
import emIcon from '../assets/icons/em.png';
import srAqIcon from '../assets/icons/sr_aq.png';
import srAcIcon from '../assets/icons/sr_ac.png';
import srOcIcon from '../assets/icons/sr_oc.png';
import srEmIcon from '../assets/icons/sr_em.png';
import cmIcon from '../assets/icons/cm.png';
import stockIcon from '../assets/icons/stock.png';

const domainImageMap = [
  { key: 'aq', value: ['air', 'quality'] },
  { key: 'we', value: ['weather', 'monitoring'] },
  { key: 'wd', value: ['water', 'distribution', 'water', 'quality'] },
  { key: 'wf', value: ['water', 'flow', 'monitoring'] },
  { key: 'sl', value: ['solar', 'monitoring'] },
  { key: 'wn', value: ['wi', 'sun'] },
  { key: 'em', value: ['energy', 'monitoring'] },
  { key: 'sr_aq', value: ['smart', 'room', 'air', 'quality'] },
  { key: 'sr_ac', value: ['smart', 'room', 'air', 'condition'] },
  { key: 'sr_oc', value: ['occupancy'] },
  { key: 'sr_em', value: ['smart', 'room', 'energy', 'monitoring'] },
  { key: 'cm', value: ['crowd', 'monitoring'] }
];

const iconMap = {
  aq: aqIcon,
  we: weIcon,
  wd: wdIcon,
  wf: wfIcon,
  sl: slIcon,
  wn: wnIcon,
  em: emIcon,
  sr_aq: srAqIcon,
  sr_ac: srAcIcon,
  sr_oc: srOcIcon,
  sr_em: srEmIcon,
  cm: cmIcon,
  stock: stockIcon
};

// Helper to get the domain name for this sensor type
function getDomainNameForSensorType(nodes) {
  if (!nodes || nodes.length === 0) return '';
  // Assume all nodes for this sensorType have the same domainName
  return nodes[0].domainName || '';
}

function getDomainIconFromDomainName(domainName) {
  if (!domainName) return iconMap.stock;
  const normalized = domainName.replace(/[\s_]+/g, ' ').toLowerCase();
  const found = domainImageMap.find(({ key, value }) =>
    value.every(word => normalized.includes(word))
  );
  return found ? (iconMap[found.key] || iconMap.stock) : iconMap.stock;
}

const SensorTypeAnalytics = ({ sensorType, nodes, parameterUnits, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [timeSeriesData, setTimeSeriesData] = useState({});
  const [displayFilters, setDisplayFilters] = useState([]);
  const [allParameters, setAllParameters] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [visibleLines, setVisibleLines] = useState({});
  const chartRefs = useRef({});

  useEffect(() => {
    if (allParameters.length > 0) {
      const initialVisibility = {};
      allParameters.forEach(param => {
        initialVisibility[param] = { min: true, max: true, avg: true };
      });
      setVisibleLines(initialVisibility);
    }
  }, [allParameters]);

  const toggleLineVisibility = (param, lineType) => {
    setVisibleLines(prev => ({
      ...prev,
      [param]: { ...prev[param], [lineType]: !prev[param][lineType] }
    }));
  };

  const renderChart = useCallback((param, containerId) => {
    if (!timeSeriesData[param] || !timeSeriesData[param].length) return;
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    if (chartRefs.current[containerId]) chartRefs.current[containerId].destroy();

    // Get only the last 29 data points
    const slicedData = timeSeriesData[param].slice(-29);

    // FIX: Ensure min/max/avg are numbers, not strings, for correct chart rendering
    const chartData = {
      labels: slicedData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })),
      datasets: [
        {
          label: 'Min',
          data: slicedData.map(d => d.min !== undefined ? Number(d.min) : null),
          borderColor: '#FBBC04',
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(251, 188, 4, 0.2)');
            gradient.addColorStop(1, 'rgba(251, 188, 4, 0.5)');
            return gradient;
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          hidden: !visibleLines[param]?.min
        },
        {
          label: 'Max',
          data: slicedData.map(d => d.max !== undefined ? Number(d.max) : null),
          borderColor: '#EA4335',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          hidden: !visibleLines[param]?.max
        },
        {
          label: 'Avg',
          data: slicedData.map(d => d.avg !== undefined ? Number(d.avg) : null),
          borderColor: '#4285F4',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          hidden: !visibleLines[param]?.avg
        }
      ]
    };

    chartRefs.current[containerId] = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false }, datalabels: { display: false } },
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Time (24h)' },
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 45, autoSkip: true, maxTicksLimit: 6, font: { size: 10 } }
          },
          y: {
            display: true,
            title: { display: true, text: parameterUnits[param] || 'Value' },
            beginAtZero: false,
            grid: { color: '#eeeeee', lineWidth: 1, drawBorder: false },
            ticks: { stepSize: context => (context.scale.max - context.scale.min) / 5 }
          }
        },
        elements: { line: { tension: 0.4 } }
      }
    });
  }, [timeSeriesData, parameterUnits, visibleLines]);

  const toggleFilterDropdown = () => setShowFilterDropdown(!showFilterDropdown);

  const handleFilterChange = (param) => {
    setDisplayFilters(prev =>
      prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param]
    );
  };

  useEffect(() => {
    const fetchAllNodeData = async () => {
      try {
        setLoading(true);

        // Fetch data for all nodes
        const allNodeData = await Promise.all(nodes.map(node =>
          axiosAuthInstance.get(`/nodes/fetch-node-data/?vertical_name=${node.domainName}&node_name=${node.nodeName}`)
            .then(res => res.data[0])
        ));

        // Extract parameters from the first node
        const parameters = allNodeData[0]?.parameters || [];
        setAllParameters(parameters);
        setDisplayFilters(parameters.slice(0, 5));

        const aggregatedMetrics = {};
        const aggregatedTimeSeries = {};

        // Build a set of all unique timestamps across all nodes
        const allTimestampsSet = new Set();
        allNodeData.forEach(nodeData => {
          if (nodeData.data && nodeData.data.length > 0) {
            nodeData.data.forEach(entry => {
              if (entry.Timestamp) allTimestampsSet.add(entry.Timestamp);
            });
          }
        });
        const allTimestamps = Array.from(allTimestampsSet).sort((a, b) => new Date(a) - new Date(b));

        // For each parameter, aggregate min/max/avg across nodes at each timestamp
        parameters.forEach((param) => {
          // For StatsDisplay: all values for this param across all nodes/timestamps
          const allValues = [];

          // For time series: for each timestamp, collect all node values for this param
          const timeSeries = allTimestamps.map(timestamp => {
            const valuesAtTimestamp = [];
            allNodeData.forEach(nodeData => {
              if (nodeData.data && nodeData.data.length > 0) {
                nodeData.data.forEach(entry => {
                  if (entry.Timestamp === timestamp && entry[param] !== null && entry[param] !== undefined) {
                    const val = parseFloat(entry[param]);
                    if (!Number.isNaN(val)) {
                      valuesAtTimestamp.push(val);
                      allValues.push(val);
                    }
                  }
                });
              }
            });
            return {
              timestamp,
              min: valuesAtTimestamp.length ? Math.min(...valuesAtTimestamp) : null,
              max: valuesAtTimestamp.length ? Math.max(...valuesAtTimestamp) : null,
              avg: valuesAtTimestamp.length ? valuesAtTimestamp.reduce((a, b) => a + b, 0) / valuesAtTimestamp.length : null
            };
          });

          aggregatedTimeSeries[param] = timeSeries.filter(d => d.min !== null && d.max !== null && d.avg !== null);

          aggregatedMetrics[param] = {
            min: allValues.length ? Math.min(...allValues).toFixed(2) : '--',
            max: allValues.length ? Math.max(...allValues).toFixed(2) : '--',
            avg: allValues.length ? (allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(2) : '--'
          };
        });

        setTimeSeriesData(aggregatedTimeSeries);
        setMetrics(aggregatedMetrics);
      } catch (err) {
        console.error(`Error loading data for sensor type ${sensorType}:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (nodes.length > 0) fetchAllNodeData();

    return () => {
      Object.values(chartRefs.current).forEach(chart => chart?.destroy());
    };
  }, [sensorType, nodes]);

  useEffect(() => {
    if (!loading && displayFilters.length > 0) {
      displayFilters.forEach((param, index) => renderChart(param, `chart-container-${index}`));
    }
  }, [loading, timeSeriesData, displayFilters, renderChart, visibleLines]);

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    minWidth: '80px',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    fontWeight: '500'
  };

  const lineButtonStyle = (param, lineType, color) => ({
    padding: '4px 8px',
    backgroundColor: visibleLines[param]?.[lineType] ? color : '#e0e0e0',
    color: visibleLines[param]?.[lineType] ? 'white' : '#666',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.6em',
    fontWeight: '500',
    textAlign: 'center',
    minWidth: '35px',
    marginLeft: '4px'
  });

  return (
    <div className="dashboard" style={{ height: '100vh', overflow: 'auto' }}>
      <div className="dashboard-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 24px',
        marginBottom: '-10px',
      }}>
        <button
          type="button"
          onClick={onBack}
          style={buttonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'black'; }}
        >
          <span style={{ fontSize: '1em', color: 'white' }}>←</span>
          <span style={{ color: 'white' }}>Back</span>
        </button>

        <h2 style={{ margin: 0, textAlign: 'center', flex: 1, color: '#343a40' }}>
          {sensorType} Analytics
        </h2>

        <div className="filter-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            className="filter-button"
            onClick={toggleFilterDropdown}
            style={{ ...buttonStyle, marginTop: '17px' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'black'; }}
          >
            <span style={{ color: 'white' }}>Filter</span>
            <span style={{ fontSize: '0.8em', color: 'white' }}>▼</span>
          </button>

          {showFilterDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '8px',
              zIndex: 100,
              minWidth: '200px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.8em' }}>Select parameters to display (max 5)</p>
              {allParameters.map(param => (
                <div key={param} style={{ marginBottom: '4px' }}>
                  <label htmlFor="filter-input" style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: displayFilters.includes(param) || displayFilters.length < 5 ? 'pointer' : 'not-allowed',
                    opacity: !displayFilters.includes(param) && displayFilters.length >= 5 ? 0.5 : 1
                  }}>
                    <input
                      id="filter-input"
                      type="checkbox"
                      checked={displayFilters.includes(param)}
                      onChange={() => handleFilterChange(param)}
                      disabled={!displayFilters.includes(param) && displayFilters.length >= 5}
                      style={{ marginRight: '8px' }}
                    />
                    {param}
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowFilterDropdown(false)}
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'black',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 100px)',
          color: '#6c757d'
        }}>
          Loading analytics data...
        </div>
      ) : (
        <div className="dashboard-containers" style={{ padding: '16px', overflow: 'visible' }}>
          <div className="container">
            <div className="container-grid grid-4">
              {[0, 1, 2, 3, 4].map((i) => {
                const filter = displayFilters[i];
                return (
                  <div className="grid-item" key={i} style={{
                    padding: '12px',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: filter ? undefined : '#fff',
                    border: filter ? undefined : '1px dashed #ddd'
                  }}>
                    {filter ? (
                      <>
                        <h3 className="box-title" style={{
                          margin: '0 0 8px 0',
                          fontSize: '0.9em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {filter}
                        </h3>
                        <SensorStatsDisplay title={filter} metrics={metrics} unit={parameterUnits[filter] || ''} />
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bbb',
                        height: '100%',
                        width: '100%',
                        minHeight: '80px'
                      }}>
                        <FaInfoCircle size={28} style={{ marginBottom: 8 }} />
                        <span style={{ fontSize: '0.95em', color: '#888', textAlign: 'center' }}>
                          Create more parameters to show analytics here
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="container">
            <div className="container-grid grid-3">
              {/* First column: 2 charts or empty slots */}
              <div className="grid-item vertically-divided">
                {[0, 1].map((i) => (
                  <div className="sub-grid-item" key={i} style={{
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: '15px',
                    background: displayFilters[i] ? undefined : '#fff',
                    border: displayFilters[i] ? undefined : '1px dashed #ddd',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {displayFilters[i] ? (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          display: 'flex',
                          zIndex: 10
                        }}>
                          <button type="button" onClick={() => toggleLineVisibility(displayFilters[i], 'min')} style={lineButtonStyle(displayFilters[i], 'min', '#FBBC04')}>
                            Min
                          </button>
                          <button type="button" onClick={() => toggleLineVisibility(displayFilters[i], 'max')} style={lineButtonStyle(displayFilters[i], 'max', '#EA4335')}>
                            Max
                          </button>
                          <button type="button" onClick={() => toggleLineVisibility(displayFilters[i], 'avg')} style={lineButtonStyle(displayFilters[i], 'avg', '#4285F4')}>
                            Avg
                          </button>
                        </div>
                        <h3 className="box-title" style={{ margin: '0 0 20px 0', fontSize: '0.9em', textAlign: 'center' }}>
                          {displayFilters[i]}
                        </h3>
                        <div style={{ height: '250px', width: '100%', marginTop: '10px' }}>
                          <canvas id={`chart-container-${i}`} />
                        </div>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bbb',
                        height: '100%',
                        width: '100%'
                      }}>
                        <FaInfoCircle size={32} style={{ marginBottom: 8 }} />
                        <span style={{ fontSize: '1em', color: '#888', textAlign: 'center' }}>
                          Create more parameters to show analytics here
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Middle column: details + chart or empty slot */}
              <div className="grid-item vertically-divided" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="sub-grid-item" style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  padding: '0',
                  background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  minHeight: '200px',
                  alignItems: 'center',
                  justifyContent: 'flex-start'
                }}>
                  {/* Left: Sensor type details text */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    margin: '15px 0 15px 15px',
                    borderRadius: '8px',
                    height: 'calc(100% - 30px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flex: 1,
                    minWidth: 0,
                    fontSize: '11px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      height: '100%',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 15px 0 15px',
                        borderBottom: 'none'
                      }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: '600',
                          textAlign: 'left',
                          flex: 1
                        }}>
                          Sensor Type Details
                        </h3>
                      </div>
                      <hr style={{
                        border: 'none',
                        borderTop: '1px solid #eee',
                        margin: '8px 0 10px 0'
                      }} />
                      <div style={{
                        padding: '0 15px 0 15px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '6px 10px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ fontWeight: '600' }}>Sensor Type:</div><div>{sensorType}</div>
                        <div style={{ fontWeight: '600' }}>Number of Nodes:</div><div>{nodes.length}</div>
                      </div>
                      <div style={{ fontWeight: '600', padding: '0 15px' }}>Parameters:</div>
                      <div style={{
                        display: 'flex',
                        flex: 1,
                        marginTop: '4px',
                        padding: '0 15px 10px 15px'
                      }}>
                        <div style={{ flex: 1 }}>
                          {allParameters.slice(0, 4).map(param => (
                            <div key={param} style={{
                              color: displayFilters.includes(param) ? '#007bff' : 'inherit',
                              fontWeight: displayFilters.includes(param) ? '600' : 'normal'
                            }}>
                              {param}
                            </div>
                          ))}
                        </div>
                        <div style={{ flex: 1 }}>
                          {allParameters.slice(4, 8).map(param => (
                            <div key={param} style={{
                              color: displayFilters.includes(param) ? '#007bff' : 'inherit',
                              fontWeight: displayFilters.includes(param) ? '600' : 'normal'
                            }}>
                              {param}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right: Image beside the container, using the domain name logic */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '140px',
                    height: '100%',
                    marginRight: '15px'
                  }}>
                    <img
                      src={getDomainIconFromDomainName(getDomainNameForSensorType(nodes))}
                      alt="Sensor Type Icon"
                      style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        background: '#eee'
                      }}
                    />
                  </div>
                </div>

                {/* Chart for 5th parameter or empty slot */}
                <div className="sub-grid-item" style={{
                  flex: 1,
                  position: 'relative',
                  height: '100%',
                  paddingTop: '15px',
                  background: displayFilters[4] ? undefined : '#fff',
                  border: displayFilters[4] ? undefined : '1px dashed #ddd',
                  justifyContent: 'center',
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {displayFilters[4] ? (
                    <>
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        display: 'flex',
                        zIndex: 10
                      }}>
                        <button type="button" onClick={() => toggleLineVisibility(displayFilters[4], 'min')} style={lineButtonStyle(displayFilters[4], 'min', '#FBBC04')}>
                          Min
                        </button>
                        <button type="button" onClick={() => toggleLineVisibility(displayFilters[4], 'max')} style={lineButtonStyle(displayFilters[4], 'max', '#EA4335')}>
                          Max
                        </button>
                        <button type="button" onClick={() => toggleLineVisibility(displayFilters[4], 'avg')} style={lineButtonStyle(displayFilters[4], 'avg', '#4285F4')}>
                          Avg
                        </button>
                      </div>
                      <h3 className="box-title" style={{ margin: '0 0 20px 0', fontSize: '0.9em', textAlign: 'center' }}>
                        {displayFilters[4]}
                      </h3>
                      <div style={{ height: '250px', width: '100%', marginTop: '10px', paddingBottom: '10px' }}>
                        <canvas id="chart-container-4" />
                      </div>
                    </>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#bbb',
                      height: '100%',
                      width: '100%'
                    }}>
                      <FaInfoCircle size={32} style={{ marginBottom: 8 }} />
                      <span style={{ fontSize: '1em', color: '#888', textAlign: 'center' }}>
                        Create more parameters to show analytics here
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Last column: 2 charts or empty slots */}
              <div className="grid-item vertically-divided">
                {[2, 3].map((i) => (
                  <div className="sub-grid-item" key={i} style={{
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: '15px',
                    background: displayFilters[i] ? undefined : '#fff',
                    border: displayFilters[i] ? undefined : '1px dashed #ddd',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {displayFilters[i] ? (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          display: 'flex',
                          zIndex: 10
                        }}>
                          <button type="button" onClick={() => toggleLineVisibility(displayFilters[i], 'min')} style={lineButtonStyle(displayFilters[i], 'min', '#FBBC04')}>
                            Min
                          </button>
                          <button type="button" onClick={() => toggleLineVisibility(displayFilters[i], 'max')} style={lineButtonStyle(displayFilters[i], 'max', '#EA4335')}>
                            Max
                          </button>
                          <button type="button" onClick={() => toggleLineVisibility(displayFilters[i], 'avg')} style={lineButtonStyle(displayFilters[i], 'avg', '#4285F4')}>
                            Avg
                          </button>
                        </div>
                        <h3 className="box-title" style={{ margin: '0 0 20px 0', fontSize: '0.9em', textAlign: 'center' }}>
                          {displayFilters[i]}
                        </h3>
                        <div style={{ height: '250px', width: '100%', marginTop: '10px' }}>
                          <canvas id={`chart-container-${i}`} />
                        </div>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bbb',
                        height: '100%',
                        width: '100%'
                      }}>
                        <FaInfoCircle size={32} style={{ marginBottom: 8 }} />
                        <span style={{ fontSize: '1em', color: '#888', textAlign: 'center' }}>
                          Create more parameters to show analytics here
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorTypeAnalytics;