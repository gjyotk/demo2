import React, { useState, useEffect } from 'react';
import { FaFilter, FaChartLine } from 'react-icons/fa';
import { axiosAuthInstance } from '../services/axiosConfig';

const NodeCard = ({ node, parameterUnits, onClickAnalytics }) => {
  const [nodeData, setNodeData] = useState(null);
  const [localFilterOpen, setLocalFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [displayFilters, setDisplayFilters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosAuthInstance.get(
          `/nodes/fetch-node-data/?vertical_name=${node.domainName}&node_name=${node.nodeName}`
        );
        
        const fetchedData = response.data[0]; // Get first node's data
        if (!fetchedData) throw new Error('No data received');

        // Set initial filters using parameters from response
        const availableParams = fetchedData.parameters || [];
        const initialFilters = availableParams.reduce((acc, param, index) => ({
          ...acc,
          [param]: index < 4
        }), {});

        setNodeData(fetchedData);
        setSelectedFilters(initialFilters);
        setDisplayFilters(availableParams.slice(0, 4));

      } catch (err) {
        console.error(`Error loading data for node ${node.nodeId}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [node]);

  const getStatsForParameter = (param) => {
    if (!nodeData?.data || !nodeData.parameters.includes(param)) {
      return { min: '--', max: '--', avg: '--' };
    }

    const values = nodeData.data
      .filter(entry => entry.Timestamp && entry[param] !== null)
      .map(entry => parseFloat(entry[param]))
      .filter(val => !Number.isNaN(val));

    if (!values.length) return { min: '--', max: '--', avg: '--' };

    return {
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    };
  };

  const handleFilterChange = (param) => {
    if (!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 4) return;
    setSelectedFilters(prev => ({ ...prev, [param]: !prev[param] }));
  };

  const applyFilters = () => {
    setDisplayFilters(nodeData.parameters.filter(param => selectedFilters[param]).slice(0, 4));
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
        <h4 style={{ marginBottom: '10px', fontSize: '1.1em', color: '#333' }}>{node.nodeName}</h4>
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
          {nodeData?.parameters.map((param) => (
            <div
              className={`filter-item ${!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 4 ? 'disabled' : ''}`}
              key={param}
              style={{ marginBottom: '4px' }}
            >
              <input
                type="checkbox"
                id={`filter-${node.nodeId}-${param}`}
                checked={selectedFilters[param] || false}
                onChange={(e) => {
                  e.stopPropagation();
                  handleFilterChange(param);
                }}
                disabled={!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 4}
                style={{ marginRight: '6px' }}
              />
              <label htmlFor={`filter-${node.nodeId}-${param}`} style={{ fontSize: '0.8em' }}>
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
              const stats = getStatsForParameter(param);
              return (
                <tr key={`${node.nodeId}-${param}`}>
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

export default NodeCard;