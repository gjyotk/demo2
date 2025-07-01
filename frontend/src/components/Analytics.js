import React, { useState, useEffect } from 'react';
import airQualityImage from '../homepage/assets/air-quality.png';
import waterQualityImage from '../homepage/assets/water-quality.png';
import waterQuantityImage from '../homepage/assets/water-quantity.png';
import wasteManagementImage from '../homepage/assets/waste-management.png';
import streetLightImage from '../homepage/assets/street-light.png';
import energyMonitoringImage from '../homepage/assets/energy-monitoring.png';
import { axiosAuthInstance } from '../services/axiosConfig';

import Dashboard from './Dashboard';

const HorizontalSplit = () => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [allDomains, setAllDomains] = useState([]);

  const domains = [
    { label: 'Air Quality', image: airQualityImage },
    { label: 'Water Quality', image: waterQualityImage },
    { label: 'Water Quantity', image: waterQuantityImage },
    { label: 'Waste Management', image: wasteManagementImage },
    { label: 'Street Light', image: streetLightImage },
    { label: 'Energy Monitoring', image: energyMonitoringImage },
  ];

useEffect(() => {
    axiosAuthInstance.get(`http://10.2.16.116:8610/stats/get-all`)
      .then((res) => {
        console.log(res.data);
        setAllDomains(res.data.domains);
      })
      .catch((err) => {
        console.error('Error fetching node data:', err);
      });
  }, []);

  const handleNodeNameClick = (nodeName, nodeId) => {
    setSelectedRow({ nodeName, nodeId });
    setShowDashboard(true);
    
  };

  const handleSensorTypeClick = (sensorType, nodes) => {
    if (nodes && nodes.length > 0) {
      setSelectedRow({
        sensorType,
        nodes: nodes.map((node) => ({
          nodeName: node.node_name,
          nodeId: node.node_id,
          latitude: node.node_latitude,
          longitude: node.node_longitude,
          area: node.node_area,
        })),
      });
      setShowDashboard(true);
    } else {
      console.error('No nodes associated with this sensor type');
    }
  };

  const handleDomainClick = (domainLabel) => {
    const domain = allDomains.find((d) => d.domain_name === domainLabel);
    if (domain && domain.sensor_types.length > 0) {
      const groupedData = domain.sensor_types.map((sensor) => ({
        sensorType: sensor.sensor_type_name,
        nodes: sensor.nodes.map((node) => ({
          nodeName: node.node_name,
          nodeId: node.node_id,
          parameters: sensor.parameters || [],
          latitude: node.node_latitude,
          longitude: node.node_longitude,
          area: node.node_area,
        })),
      }));

      setSelectedRow({
        domainName: domain.domain_name,
        groupedData,
        parameters: domain.parameters,
      });
      setShowDashboard(true);
    } else {
      console.error('No sensor types associated with this domain');
    }
  };

  const handleBackClick = () => {
    setShowDashboard(false);
    setSelectedRow(null);
  };

  if (showDashboard) {
    return (
      <Dashboard 
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}  // MUST be passed
        onBack={handleBackClick}
      />
    );
  }

  if (showDashboard) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Dashboard selectedRow={selectedRow} onBack={handleBackClick} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Component */}
      <div style={{ flex: '4', backgroundColor: 'transparent' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '16px', fontFamily: 'Inter, sans-serif', color: '#333' }}>
          Dashboard
        </h1>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            height: '15vw',
            marginTop: '-20px',
          }}
        >
          {domains.map((domain) => (
            <div
              key={domain.domain_id}
              className="domain-card"
              role="button"
              tabIndex="0"
              onClick={() => handleDomainClick(domain.label)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleDomainClick(domain.domain_name);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '120px',
                height: '120px',
                backgroundColor: '#f0ecfc',
                borderRadius: '12px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <img
                src={domain.image}
                alt={domain.label}
                style={{ width: '50px', height: '50px', marginBottom: '4px' }}
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#333',
                  marginTop: '8px',
                  textAlign:
                    domain.label === 'Waste Management' || domain.label === 'Energy Monitoring' ? 'center' : 'left',
                }}
              >
                {domain.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Component */}
      <div style={{ flex: '6', overflow: 'hidden', marginTop: '-20px' }}>
        <div
          style={{
            height: '300px',
            overflow: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Inter, sans-serif',
              color: '#333',
              border: '2px solid #d0d5e2', // Make outer border bold
            }}
          >
            <thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: '#e8ecf4',
              }}
            >
              <tr
                style={{
                  backgroundColor: '#e8ecf4',
                  color: '#2b2f3e',
                  fontWeight: 600,
                  borderBottom: '2px solid #d0d5e2', // Make bottom border bold
                }}
              >
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  width: '33%',
                  border: '2px solid #d0d5e2' // Make header cell borders bold
                }}>Domain</th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  width: '33%',
                  border: '2px solid #d0d5e2' 
                }}>Sensor Type</th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  width: '33%',
                  border: '2px solid #d0d5e2' 
                }}>Node Name</th>
              </tr>
            </thead>
            <tbody>
              {allDomains.map((domain) => {
                const domainRowCount = domain.sensor_types.reduce(
                  (acc, sensor) => acc + Math.max(1, sensor.nodes.length),
                  0
                ) || 1;

                return domain.sensor_types.length > 0 ? (
                  domain.sensor_types.map((sensorType, sensorIndex) => {
                    const isFirstSensor = sensorIndex === 0;
                    return sensorType.nodes.length > 0 ? (
                      sensorType.nodes.map((node, nodeIndex) => (
                        <tr
                          key={`${domain.domain_id}-${sensorType.sensor_type_id}-${node.node_id}`}
                          style={{
                            backgroundColor: '#ffffff'  // Set uniform color for all rows
                          }}
                        >
                          {isFirstSensor && nodeIndex === 0 && (
                            <td
                              rowSpan={domainRowCount}
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #d0d5e2',
                                borderRight: '1px solid #d0d5e2',
                                cursor: 'pointer',
                                verticalAlign: 'top',
                                backgroundColor: '#ffffff',  // Match row color
                              }}
                              onClick={() => handleDomainClick(domain.domain_name)}
                            >
                              {domain.domain_name}
                            </td>
                          )}
                          {nodeIndex === 0 && (
                            <td
                              rowSpan={sensorType.nodes.length}
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #d0d5e2',
                                borderRight: '1px solid #d0d5e2',
                                cursor: 'pointer',
                                verticalAlign: 'top',
                              }}
                              onClick={() => handleSensorTypeClick(sensorType.sensor_type_name, sensorType.nodes)}
                            >
                              {sensorType.sensor_type_name}
                            </td>
                          )}
                          <td
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid #d0d5e2',
                              borderRight: '1px solid #d0d5e2',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleNodeNameClick(node.node_name, node.node_id)}
                          >
                            {node.node_name}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={`${domain.domain_id}-${sensorType.sensor_type_id}-empty`}>
                        {isFirstSensor && <td rowSpan={domain.sensor_types.length}>{domain.domain_name}</td>}
                        <td>{sensorType.sensor_type_name}</td>
                        <td>No nodes available</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr key={`${domain.domain_id}-empty`}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #d0d5e2', borderRight: '1px solid #d0d5e2' }}>{domain.domain_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #d0d5e2', borderRight: '1px solid #d0d5e2' }}>No sensor types</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #d0d5e2', borderRight: '1px solid #d0d5e2' }}>No nodes</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HorizontalSplit;
