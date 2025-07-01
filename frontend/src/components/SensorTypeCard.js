import React, { useState, useEffect } from 'react';
import { FaFilter, FaChartLine } from 'react-icons/fa';
import { axiosAuthInstance } from '../services/axiosConfig';


const SensorTypeCard = ({ sensorType, parameterUnits, nodes, onClickAnalytics }) => {
  const [loading, setLoading] = useState(true);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [localFilterOpen, setLocalFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [displayFilters, setDisplayFilters] = useState([]);

  useEffect(() => {
    const fetchAllNodeData = async () => {
      try {
        setLoading(true);
        
        // Fetch data for all nodes of this sensor type
        const nodesDataPromises = nodes.map(node =>
          axiosAuthInstance.get(`/nodes/fetch-node-data/?vertical_name=${node.domainName}&node_name=${node.nodeName}`)
        );

        const responses = await Promise.all(nodesDataPromises);
        const nodesData = responses.map(response => response.data[0]).filter(Boolean);

        if (!nodesData.length) throw new Error('No data available');

        // Get parameters from first node
        const firstNode = nodesData[0];
        const parameters = firstNode.parameters || [];

        // Initialize aggregated stats for each parameter
        const aggregatedStats = {};
        parameters.forEach((param, paramIndex) => {
          const allValues = [];
          
          // Collect values from all nodes
          nodesData.forEach(nodeData => {
            const values = nodeData.data
              .filter(entry => entry.Timestamp && entry[param] !== null)
              .map(entry => parseFloat(entry[param]))
              .filter(val => !Number.isNaN(val));
            allValues.push(...values);
          });

          if (allValues.length) {
            aggregatedStats[param] = {
              min: Math.min(...allValues).toFixed(2),
              max: Math.max(...allValues).toFixed(2),
              avg: (allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(2),
              ranges: {
                ideal: firstNode.ideal?.[paramIndex],
                moderate: firstNode.moderate?.[paramIndex],
                extreme: firstNode.extreme?.[paramIndex]
              }
            };
          } else {
            aggregatedStats[param] = { 
              min: '--', 
              max: '--', 
              avg: '--',
              ranges: {
                ideal: firstNode.ideal?.[paramIndex],
                moderate: firstNode.moderate?.[paramIndex],
                extreme: firstNode.extreme?.[paramIndex]
              }
            };
          }
        });

        console.log('Aggregated stats:', aggregatedStats);

        // Set initial filters
        const initialFilters = parameters.reduce((acc, param, index) => ({
          ...acc,
          [param]: index < 4
        }), {});

        setAggregatedData({
          parameters,
          stats: aggregatedStats
        });
        setSelectedFilters(initialFilters);
        setDisplayFilters(parameters.slice(0, 4));

      } catch (err) {
        console.error(`Error loading data for sensor type ${sensorType}:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (nodes.length > 0) {
      fetchAllNodeData();
    }
  }, [sensorType, nodes]);

  const handleFilterChange = (param) => {
    if (!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 4) return;
    setSelectedFilters(prev => ({ ...prev, [param]: !prev[param] }));
  };

  const applyFilters = () => {
    setDisplayFilters(Object.keys(selectedFilters).filter(param => selectedFilters[param]).slice(0, 4));
    setLocalFilterOpen(false);
  };

  return (
    <div style={{
      background: '#f7f7f7',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ marginBottom: '10px', fontSize: '1.1em', color: '#333' }}>{sensorType}</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="filter-button" 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              setLocalFilterOpen(!localFilterOpen);
            }}
            style={{ 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '4px',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              padding: '0'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; }}  
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'black'; }}
          >
            <FaFilter size={14} /> 
          </button>

          <button 
            className="analytics-button" 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              onClickAnalytics();
            }}
            style={{ 
              backgroundColor: 'black',
              color: 'white',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0',
              transition: 'background-color 0.3s ease, color 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; }}  
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'black'; }}
          >
            <FaChartLine size={14} /> 
          </button>
        </div>
      </div>

      {localFilterOpen && (
        <div className="filter-dropdown" style={{
          position: 'absolute',
          right: '16px',
          top: '40px',
          zIndex: 1000,
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.8em' }}>Select parameters (max 4)</p>
          {Object.keys(aggregatedData?.stats || {}).map((param) => (
            <div
              className={`filter-item ${!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 4 ? 'disabled' : ''}`}
              key={param}
              style={{ marginBottom: '4px' }}
            >
              <input
                type="checkbox"
                id={`filter-${sensorType}-${param}`}
                checked={selectedFilters[param] || false}
                onChange={(e) => {
                  e.stopPropagation();
                  handleFilterChange(param);
                }}
                disabled={!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 4}
                style={{ marginRight: '6px' }}
              />
              <label htmlFor={`filter-${sensorType}-${param}`} style={{ fontSize: '0.8em' }}>
                {param}
              </label>
            </div>
          ))}
          <button 
            className="apply-filter" 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              applyFilters();
            }}
            style={{
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
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'black'; }}
          >
            Apply
          </button>
        </div>
      )}

      {loading ? <div>Loading data...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.8em' }}>Metric</th>
              <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.8em' }}>Min</th>
              <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.8em' }}>Max</th>
              <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.8em' }}>Avg</th>
            </tr>
          </thead>
          <tbody>
            {displayFilters.map((param) => {
              const stats = aggregatedData?.stats[param] || { min: '--', max: '--', avg: '--' };
              return (
                <tr key={`${sensorType}-${param}`}>
                  <td style={{ padding: '6px 8px', fontSize: '0.8em' }}>
                    {param} {parameterUnits[param] ? `(${parameterUnits[param]})` : ''}
                  </td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', fontSize: '0.8em' }}>{stats.min}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', fontSize: '0.8em' }}>{stats.max}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', fontSize: '0.8em' }}>{stats.avg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SensorTypeCard;