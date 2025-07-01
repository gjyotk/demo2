import React, { useState, useEffect } from 'react';
import { FaEdit, FaCheck } from 'react-icons/fa';
import { axiosAuthInstance } from '../services/axiosConfig';

// Convert {min, max} to [min, max] format
const convertThresholdToArray = (threshold) => {
  if (!threshold) return [0, 0];
  if (Array.isArray(threshold)) return threshold;
  return [threshold.min || 0, threshold.max || 0];
};

const getParameterUnit = (param) => {
  const unitMap = {
    'pm2.5': 'μg/m³',
    'pm10': 'μg/m³',
    'temperature': '°C',
    'relative_humidity': '%'
  };
  return unitMap[param] || '';
};

const processThresholds = (nodeData) => {
  // Debug: log nodeData for inspection
  console.log('[DEBUG] processThresholds input nodeData:', nodeData);
  if (!nodeData?.parameters) return [];

  const result = nodeData.parameters.map((param, index) => {
    // Get the ranges for each threshold type
    const idealRange = nodeData.ideal?.[index]?.[0] || [0, 0];
    const moderateRanges = nodeData.moderate?.[index] || [[0, 0], [0, 0]];
    const extremeRanges = nodeData.extreme?.[index]?.[0] || [0, 0];

    return {
      name: param,
      ideal: idealRange,
      moderate: moderateRanges,
      extreme: [
        [-Infinity, extremeRanges[0]], // Lower extreme range
        [extremeRanges[1], Infinity]   // Upper extreme range
      ],
      unit: getParameterUnit(param)
    };
  });

  // Debug: log processed thresholds
  console.log('[DEBUG] processThresholds output:', result);
  return result;
};

const ThresholdCard = React.memo(
  ({
    type,
    color,
    bgColor,
    borderColor,
    ranges,
    paramName,
    unit,
    onEdit,
    isEditing,
    onValueChange,
  }) => {
    const isEditingThis = isEditing.paramName === paramName && isEditing.thresholdType === type.toLowerCase();

    const formatValue = (value) => {
      if (value === Infinity) return '∞';
      if (value === -Infinity) return '-∞';
      if (value === '' || value === undefined || value === null) return '--';
      return value;
    };

    const renderRanges = () => {
      if (type === 'Moderate' || type === 'Extreme') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ranges.map((range, idx) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`${paramName}-${type}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: 0,
                  width: '100%',
                }}
              >
                {isEditingThis ? (
                  <>
                    <input
                      type="number"
                      value={range[0] === -Infinity ? '' : range[0]}
                      onChange={(e) =>
                        onValueChange(
                          paramName,
                          type.toLowerCase(),
                          idx,
                          0, // range index, value index
                          e.target.value
                        )
                      }
                      style={{ width: '70px', padding: '4px' }}
                      disabled={type === 'Extreme' && idx === 0 && range[0] === -Infinity}
                      placeholder={type === 'Extreme' && idx === 0 && range[0] === -Infinity ? '-∞' : ''}
                    />
                    <span style={{ fontWeight: 600 }}> - </span>
                    <input
                      type="number"
                      value={range[1] === Infinity ? '' : range[1]}
                      onChange={(e) =>
                        onValueChange(
                          paramName,
                          type.toLowerCase(),
                          idx,
                          1, // range index, value index
                          e.target.value
                        )
                      }
                      style={{ width: '70px', padding: '4px' }}
                      disabled={type === 'Extreme' && idx === 1 && range[1] === Infinity}
                      placeholder={type === 'Extreme' && idx === 1 && range[1] === Infinity ? '∞' : ''}
                    />
                    <span>{unit}</span>
                  </>
                ) : (
                  <span>
                    {formatValue(range[0])} <span style={{ fontWeight: 600 }}>-</span> {formatValue(range[1])} {unit}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      }
      
      // For Ideal range (single range)
      return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isEditingThis ? (
            <>
              <input
                type="number"
                value={ranges[0]}
                onChange={(e) =>
                  onValueChange(paramName, type.toLowerCase(), 0, 0, e.target.value)
                }
                style={{ width: '70px', padding: '4px' }}
              />
              <span style={{ fontWeight: 600 }}>-</span>
              <input
                type="number"
                value={ranges[1]}
                onChange={(e) =>
                  onValueChange(paramName, type.toLowerCase(), 0, 1, e.target.value)
                }
                style={{ width: '70px', padding: '4px' }}
              />
              {unit}
            </>
          ) : (
            `${formatValue(ranges[0])} - ${formatValue(ranges[1])} ${unit}`
          )}
        </div>
      );
    };

    return (
      <div
        style={{
          backgroundColor: bgColor,
          padding: '15px',
          borderRadius: '8px',
          borderLeft: `4px solid ${borderColor}`,
          position: 'relative',
        }}
      >
        <h4
          style={{
            color,
            marginTop: 0,
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {type}
          {!isEditingThis && (
            <button
              type="button"
              onClick={() => onEdit(paramName, type.toLowerCase())}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: color,
                padding: '4px',
              }}
            >
              <FaEdit size={14} />
            </button>
          )}
        </h4>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>
          {renderRanges()}
        </div>
      </div>
    );
  }
);

ThresholdCard.displayName = 'ThresholdCard';

const ThresholdModel = ({ nodeData, onClose, refreshNodeData }) => {
  const [isEditing, setIsEditing] = useState({});
  const [thresholds, setThresholds] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  console.log('Threshold data:', nodeData);

  useEffect(() => {
    if (nodeData) {
      // Debug: log nodeData on mount/update
      console.log('[DEBUG] useEffect nodeData:', nodeData);
      setThresholds(processThresholds(nodeData));
    }
  }, [nodeData]);

  const handleEdit = (paramName, thresholdType) => {
    setIsEditing({ paramName, thresholdType });
  };

  const handleThresholdChange = (paramName, thresholdType, rangeIndex, valueIndex, newValue) => {
    setThresholds(prev => prev.map(param => {
      if (param.name !== paramName) return param;
      
      const updatedParam = { ...param };
      const parsedValue = newValue === '' ? '' : parseFloat(newValue);
      
      if (thresholdType === 'ideal') {
        updatedParam.ideal = updatedParam.ideal.map((val, idx) => 
          idx === valueIndex ? parsedValue : val
        );
      } else {
        updatedParam[thresholdType] = updatedParam[thresholdType].map((range, idx) => {
          if (idx !== rangeIndex) return range;
          return range.map((val, vIdx) => 
            vIdx === valueIndex ? parsedValue : val
          );
        });
      }
      
      return updatedParam;
    }));
    
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Prepare data for API in the required format
      const verticalData = {
        res_name: nodeData.domainName || 'Vertical',
        res_short_name: (nodeData.domainName || 'V').substring(0, 3).toUpperCase(),
        description: `Threshold settings for ${nodeData.domainName || 'vertical'}`,
        labels: thresholds.map(t => t.name),
        name: thresholds.map(t => t.name),
        data_types: thresholds.map(() => 'float'),
        accuracy: thresholds.map(() => 'high'),
        units: thresholds.map(t => t.unit),
        resolution: thresholds.map(() => '0.01'),
        pdescription: thresholds.map(t => `Thresholds for ${t.name}`),
        ideal: thresholds.map(t => ({ 
          min: t.ideal[0] !== '' ? Number(t.ideal[0]) : 0, 
          max: t.ideal[1] !== '' ? Number(t.ideal[1]) : 0 
        })),
        // FIX: moderate is now an array of {min, max} objects (use first moderate range)
        moderate: thresholds.map(t => ({
          min: t.moderate[0][0] !== '' ? Number(t.moderate[0][0]) : 0,
          max: t.moderate[0][1] !== '' ? Number(t.moderate[0][1]) : 0
        })),
        extreme: thresholds.map(t => ({ 
          min: t.extreme[0][1] !== '' ? Number(t.extreme[0][1]) : 0, 
          max: t.extreme[1][0] !== '' ? Number(t.extreme[1][0]) : 0 
        }))
      };

      // Debug: log verticalData before sanitization
      console.log('[DEBUG] verticalData before sanitization:', verticalData);

      // Convert Infinity values to null or appropriate values
      const sanitizedData = JSON.parse(JSON.stringify(verticalData, (key, value) => {
        if (value === Infinity) return "Infinity";
        if (value === -Infinity) return "-Infinity";
        return value;
      }));

      // Debug: log sanitizedData before sending to API
      console.log('[DEBUG] sanitizedData to be sent:', sanitizedData);

      const apiUrl = `/verticals/update-ae/${nodeData.verticalId}`;
      console.log('[DEBUG] PUT URL:', apiUrl);

      const response = await axiosAuthInstance.put(apiUrl, sanitizedData);

      // Debug: log API response
      console.log('[DEBUG] API response:', response);

      setHasChanges(false);
      setIsEditing({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      if (refreshNodeData) {
        refreshNodeData();
      }
    } catch (error) {
      // Debug: log error details
      console.error('[DEBUG] Error saving thresholds:', error);
      if (error.response) {
        console.error('[DEBUG] Error response data:', error.response.data);
        console.error('[DEBUG] Error response status:', error.response.status);
        console.error('[DEBUG] Error response headers:', error.response.headers);
      }
      setSaveError(error.response?.data?.message || 'Failed to save thresholds. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        width: '80%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Parameter Thresholds</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              style={{
                ...buttonStyle,
                opacity: (!hasChanges || isSaving) ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              style={buttonStyle}
            >
              Close
            </button>
          </div>
        </div>

        {saveError && (
          <div style={{ 
            color: 'red', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffeeee',
            borderRadius: '4px'
          }}>
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div style={{ 
            color: 'green',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#eeffee',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaCheck /> Thresholds updated successfully!
          </div>
        )}

        {thresholds.length > 0 ? (
          <div style={{ marginBottom: '20px' }}>
            {thresholds.map(({ name, ideal, moderate, extreme, unit }) => (
              <div key={name} style={{ marginBottom: '30px' }}>
                <h3 style={{
                  marginBottom: '10px',
                  borderBottom: '1px solid #eee',
                  paddingBottom: '5px',
                  textTransform: 'capitalize'
                }}>
                  {name.replace(/_/g, ' ')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <ThresholdCard
                    type="Ideal"
                    color="#00C853"
                    bgColor="rgba(0, 200, 83, 0.1)"
                    borderColor="#00C853"
                    ranges={ideal}
                    paramName={name}
                    unit={unit}
                    onEdit={handleEdit}
                    isEditing={isEditing}
                    onValueChange={handleThresholdChange}
                  />
                  <ThresholdCard
                    type="Moderate"
                    color="#FFAB00"
                    bgColor="rgba(255, 171, 0, 0.1)"
                    borderColor="#FFAB00"
                    ranges={moderate}
                    paramName={name}
                    unit={unit}
                    onEdit={handleEdit}
                    isEditing={isEditing}
                    onValueChange={handleThresholdChange}
                  />
                  <ThresholdCard
                    type="Extreme"
                    color="#FF3D00"
                    bgColor="rgba(255, 61, 0, 0.1)"
                    borderColor="#FF3D00"
                    ranges={extreme}
                    paramName={name}
                    unit={unit}
                    onEdit={handleEdit}
                    isEditing={isEditing}
                    onValueChange={handleThresholdChange}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            marginBottom: '20px', 
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '16px', color: '#666' }}>No threshold data available for this node</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThresholdModel;