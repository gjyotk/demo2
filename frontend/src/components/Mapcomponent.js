import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const Mapcomponent = ({ nodes = [] }) => {
  const [mapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([reactLeaflet, L]) => {
      const { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } = reactLeaflet;

      // Function to create custom colored markers
      const createCustomIcon = color => new L.DivIcon({
        html: `
          <div style="
            position: relative;
            width: 30px;
            height: 30px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        className: '', 
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });

      // Dynamically fit map bounds to all node markers
      const FitBounds = () => {
        const map = useMap();

        useEffect(() => {
          if (nodes.length > 0) {
            const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }, [map, nodes]);

        return null;
      };

      // Create a legend component
      const Legend = () => {
        const map = useMap();
        
        // Get unique sensor types with their colors
        const sensorTypes = {};
        nodes.forEach(node => {
          if (node.sensorTypeName && node.color && !sensorTypes[node.sensorTypeName]) {
            sensorTypes[node.sensorTypeName] = node.color;
          }
        });
        
        useEffect(() => {
          if (Object.keys(sensorTypes).length > 0) {
            const legend = L.control({ position: 'bottomright' });
            
            legend.onAdd = () => {
              const div = L.DomUtil.create('div', 'legend');
              div.style.backgroundColor = 'white';
              div.style.padding = '10px';
              div.style.borderRadius = '5px';
              div.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
              
              let html = '<h4 style="margin:0 0 10px 0; font-size:14px;">Sensor Types</h4>';
              
              Object.entries(sensorTypes).forEach(([type, color]) => {
                html += `
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                    <div style="
                      position: relative;
                      width: 20px;
                      height: 20px;
                      background-color: ${color};
                      border: 2px solid white;
                      border-radius: 50%;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                      margin-right:8px;
                    ">
                      <div style="
                        width: 6px;
                        height: 6px;
                        background-color: white;
                        border-radius: 50%;
                      "></div>
                    </div>
                    <span style="font-size:12px;">${type}-Nodes</span>
                  </div>
                `;
              });
              
              div.innerHTML = html;
              return div;
            };
            
            legend.addTo(map);
            
            return () => {
              legend.remove();
            };
          }
          return undefined; // Added explicit return for consistency
        }, [map, nodes]);
        
        return null;
      };

      setMapComponents(
        <MapContainer
          center={[0, 0]} 
          zoom={13}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '8px',
            marginBottom: '15px',
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {nodes.map((node) => (
            <Marker 
              key={`${node.nodeName}-${node.lat}-${node.lng}`} 
              position={[node.lat, node.lng]}
              icon={createCustomIcon(node.color)}
            >
              <Popup>
                <div>
                  <p><strong>Domain:</strong> {node.domainName}</p>
                  <p><strong>Sensor Type:</strong> {node.sensorTypeName}</p>
                  <p><strong>Node Name:</strong> {node.nodeName}</p>
                  <p><strong>Area:</strong> {node.nodeArea}</p>
                  <p><strong>Coordinates:</strong> {node.lat}, {node.lng}</p>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {node.nodeName}
              </Tooltip>
            </Marker>
          ))}
          <FitBounds />
          <Legend />
        </MapContainer>
      );
    });
  }, [nodes]);

  if (!mapComponents) {
    return (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        Loading map...
      </div>
    );
  }

  return mapComponents;
};

export default Mapcomponent;