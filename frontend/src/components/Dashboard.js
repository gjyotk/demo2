import React, { useState, useEffect } from 'react';
import { FaFilter, FaChevronLeft, FaChevronRight, FaEdit, FaInfoCircle } from 'react-icons/fa';
import Map from './Mapcomponent';
import TimeSeriesChart from './TimeSeriesChart';
import StatsDisplay from './StatsDisplay';
import SensorTypeCard from './SensorTypeCard';
import NodeCard from './NodeCard';
import SensorTypeAnalytics from './SensorTypeAnalytics';
import DropdownSelector from './DropdownSelector';
import './Dashboard.css';
import { axiosAuthInstance } from '../services/axiosConfig';
import ThresholdModel from './ThresholdModel';
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
import chatbotNavService from '../services/ChatbotNavigationService';
import { useAuth } from '../contexts/AuthContext';

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

function getDomainIcon(domainName) {
  if (!domainName) return iconMap.stock;
  const normalized = domainName.replace(/[\s_]+/g, ' ').toLowerCase();
  const found = domainImageMap.find(({ key, value }) =>
    value.every(word => normalized.includes(word))
  );
  return found ? (iconMap[found.key] || iconMap.stock) : iconMap.stock;
}

const Dashboard = ({ selectedRow, setSelectedRow, onBack }) => {
  const [currentNode, setCurrentNode] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [descriptor, setDescriptor] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [displayFilters, setDisplayFilters] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [averages, setAverages] = useState({});
  const [parameterUnits, setParameterUnits] = useState({});
  const [allNodes, setAllNodes] = useState([]);
  const [viewStack, setViewStack] = useState([]);
  const [cardsPage, setCardsPage] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [domains, setDomains] = useState([]);
  const [sensorTypes, setSensorTypes] = useState([]);
  const [showSensorTypeAnalytics, setShowSensorTypeAnalytics] = useState(false);
  const [currentSensorType, setCurrentSensorType] = useState(null);
  const [parameterRanges, setParameterRanges] = useState({});
  const [showThresholdModel, setShowThresholdModel] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const CARDS_PER_PAGE = 2;
  const { isLoggedIn, user } = useAuth();

  const isDomainView = selectedRow?.domainName && selectedRow?.groupedData && !currentNode && !showSensorTypeAnalytics;
  const isSensorTypeView = selectedRow?.sensorType && selectedRow?.nodes && !currentNode && !showSensorTypeAnalytics;

  // Function to handle opening the threshold editor
  const handleEditThresholds = () => {
    setShowThresholdModel(true);
  };

  useEffect(() => {
    axiosAuthInstance
      .get(`/stats/get-all`)
      .then((res) => {
        const { data } = res;

        const unitsMap = {};
        const nodesList = [];
        const domainList = [];
        const sensorTypeList = [];

        data.domains.forEach((domain) => {
          domainList.push(domain.domain_name);
          domain.parameters.forEach((param) => {
            unitsMap[param.parameter_name] = param.units;
          });
          domain.sensor_types.forEach((sensorType) => {
            sensorTypeList.push(sensorType.sensor_type_name);
            sensorType.nodes.forEach((node) => nodesList.push({
              domainName: domain.domain_name,
              sensorTypeName: sensorType.sensor_type_name,
              nodeName: node.node_name,
              nodeArea: node.node_area,
              lat: node.node_latitude,
              lng: node.node_longitude,
              nodeId: node.node_id,
              sensorTypeId: sensorType.sensor_type_id,
            }));
          });
        });

        setParameterUnits(unitsMap);
        setAllNodes(nodesList);
        setDomains([...new Set(domainList)]);
        setSensorTypes([...new Set(sensorTypeList)]);
      })
      .catch((err) => console.error('Error fetching parameter units/config:', err));
  }, []);

  useEffect(() => {
    if (currentNode && !isDomainView && !isSensorTypeView) {
      const nodeSpecificFilters = descriptor.reduce((acc, param, index) => ({
        ...acc,
        [param]: index < 5
      }), {});
      
      setSelectedFilters(nodeSpecificFilters);
      setDisplayFilters(descriptor.slice(0, 5));
    } else {
      const defaultFilters = descriptor.reduce((acc, param, index) => ({
        ...acc,
        [param]: index < 5
      }), {});
      
      setSelectedFilters(defaultFilters);
      setDisplayFilters(descriptor.slice(0, 4));
    }
  }, [currentNode, isDomainView, isSensorTypeView, descriptor]);

  const getNodes = () => {
    if (isDomainView) return allNodes.filter(n => n.domainName === selectedRow.domainName);
    if (isSensorTypeView) return allNodes.filter(n => n.sensorTypeName === selectedRow.sensorType);
    if (currentNode?.nodeId) return [{ nodeName: currentNode.nodeName, nodeId: currentNode.nodeId }];
    return [];
  };

  const getColorForSensorType = (sensorType) => {
    let hash = 0;
    for (let i = 0; i < sensorType.length; i += 1) {
      hash = sensorType.charCodeAt(i) + ((hash << 5) - hash); // eslint-disable-line no-bitwise
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const nodes = getNodes();
  const cardsTotalPages = Math.ceil(nodes.length / CARDS_PER_PAGE);
  const currentCards = nodes.slice((cardsPage - 1) * CARDS_PER_PAGE, cardsPage * CARDS_PER_PAGE);

  useEffect(() => {
    if (selectedRow?.nodeId) {
      const matchedNode = allNodes.find(n => n.nodeId === selectedRow.nodeId);
      if (matchedNode) {
        setCurrentNode({
          nodeId: matchedNode.nodeId,
          nodeName: matchedNode.nodeName,
          domainName: matchedNode.domainName,
          sensorTypeName: matchedNode.sensorTypeName
        });
      } else {
        console.warn("Selected nodeId not found in allNodes:", selectedRow.nodeId);
      }
    }
  }, [selectedRow, allNodes]);

  useEffect(() => {
    if (currentNode?.nodeId) {
      const nodeInfo = allNodes.find(n => n.nodeId === currentNode.nodeId);
      if (nodeInfo) setNodeDetails({
        domain: nodeInfo.domainName,
        sensorType: nodeInfo.sensorTypeName,
        nodeName: nodeInfo.nodeName,
        area: nodeInfo.nodeArea,
        coordinates: `${nodeInfo.lat}, ${nodeInfo.lng}`
      });
    }
  }, [currentNode, allNodes]);

  const paginateCards = (pageNumber) => {
    setTransitioning(true);
    setTimeout(() => {
      setCardsPage(pageNumber);
      setTransitioning(false);
    }, 300);
  };

  const handleNodeAnalyticsClick = (node, fromSensorTypeView = false) => {
    setViewStack(prev => [...prev, { 
      currentNode, 
      selectedRow,
      fromSensorTypeView
    }]);
    setCurrentNode(node);
    setCardsPage(1);
  };

  const handleSensorTypeAnalyticsClick = (sensorType) => {
    setCurrentSensorType(sensorType);
    setShowSensorTypeAnalytics(true);
  };

  const handleBackClick = () => {
    if (showSensorTypeAnalytics) {
      setShowSensorTypeAnalytics(false);
      return;
    }
    
    if (viewStack.length > 0) {
      const prevView = viewStack[viewStack.length - 1];
      setCurrentNode(prevView.currentNode);
      setSelectedRow(prevView.selectedRow);
      setViewStack(prev => prev.slice(0, -1));
      
      if (prevView.fromSensorTypeView) {
        const sensorNodes = allNodes.filter(n => n.sensorTypeName === prevView.selectedRow.sensorType);
        if (sensorNodes.length) {
          setSelectedRow({ sensorType: prevView.selectedRow.sensorType, nodes: sensorNodes });
          setCurrentNode(null);
        }
      }
    } else {
      onBack();
    }
  };

  const handleDomainChange = (domain) => {
    const domainNodes = allNodes.filter(n => n.domainName === domain);
    if (domainNodes.length) {
      setSelectedRow({
        domainName: domain,
        groupedData: [{
          sensorType: domainNodes[0].sensorTypeName,
          nodes: domainNodes
        }]
      });
      setCurrentNode(null);
      setViewStack([]);
      setShowSensorTypeAnalytics(false);
    }
  };

  const handleSensorTypeChange = (sensorType) => {
    const sensorNodes = allNodes.filter(n => n.sensorTypeName === sensorType);
    if (sensorNodes.length) {
      setSelectedRow({ sensorType, nodes: sensorNodes });
      setCurrentNode(null);
      setViewStack([]);
      setShowSensorTypeAnalytics(false);
    }
  };

  const handleNodeChange = (nodeName) => {
    const node = allNodes.find(n => n.nodeName === nodeName);
    if (node) {
      setCurrentNode({ nodeName: node.nodeName, nodeId: node.nodeId });
      setViewStack([]);
      setShowSensorTypeAnalytics(false);
    }
  };

  const getHeaderTitle = () => {
    if (showSensorTypeAnalytics) {
      return (
        <h2 style={{ margin: 0, color: '#333', fontSize: '1.5em', fontWeight: '600' }}>
          {currentSensorType} Analytics
        </h2>
      );
    }
    
    if (currentNode) {
      const matchedNode = allNodes.find(n => n.nodeId === currentNode.nodeId);
      const currentDomain = matchedNode?.domainName;
      const currentSensorType = matchedNode?.sensorTypeName;
      
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DropdownSelector 
            options={domains} 
            currentValue={currentDomain} 
            onSelect={handleDomainChange}
            searchable
          />
          <span style={{ color: '#666' }}>›</span>
          <DropdownSelector 
            options={sensorTypes.filter(st => allNodes.some(n => n.domainName === currentDomain && n.sensorTypeName === st))} 
            currentValue={currentSensorType} 
            onSelect={handleSensorTypeChange}
            searchable
          />
          <span style={{ color: '#666' }}>›</span>
          <DropdownSelector 
            options={allNodes.filter(n => n.domainName === currentDomain && n.sensorTypeName === currentSensorType).map(n => n.nodeName)} 
            currentValue={currentNode.nodeName} 
            onSelect={handleNodeChange}
            searchable
          />
        </div>
      );
    }
    if (isDomainView) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <DropdownSelector 
          options={domains} 
          currentValue={selectedRow.domainName} 
          onSelect={handleDomainChange}
          searchable
        />
      </div>
    );
    if (isSensorTypeView) {
      const currentDomain = allNodes.find(n => n.sensorTypeName === selectedRow.sensorType)?.domainName;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DropdownSelector 
            options={domains} 
            currentValue={currentDomain} 
            onSelect={handleDomainChange}
            searchable
          />
          <span style={{ color: '#666' }}>›</span>
          <DropdownSelector 
            options={sensorTypes.filter(st => allNodes.some(n => n.domainName === currentDomain && n.sensorTypeName === st))} 
            currentValue={selectedRow.sensorType} 
            onSelect={handleSensorTypeChange}
            searchable
          />
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '1.5em', fontWeight: '600' }}>
          {currentNode?.nodeName || 'No Node Selected'}
        </h2>
      </div>
    );
  };

  useEffect(() => {
    if (currentNode?.nodeId && !isDomainView && !isSensorTypeView && !showSensorTypeAnalytics) {
      axiosAuthInstance.get(`/nodes/fetch-node-data/?vertical_name=${currentNode.domainName}&node_name=${currentNode.nodeName}`)
        .then((response) => {
          const { data } = response;
          const nodeData = data[0] || {};
          console.log('Fetch data:', nodeData);
          
          // Set parameters and thresholds
          const descriptorArray = nodeData?.parameters || [];
          setDescriptor(descriptorArray);
          
          // Store node data for threshold Model with all required fields
          setCurrentNode(prev => ({
            ...prev,
            parameters: nodeData.parameters || [],
            ideal: nodeData.ideal || [],
            moderate: nodeData.moderate || [],
            extreme: nodeData.extreme || [],
            units: nodeData.units || descriptorArray.map(p => parameterUnits[p] || ''),
            sensorTypeId: nodeData.sensortype_id || prev.sensorTypeId,
            verticalId: nodeData.vertical_id || prev.verticalId,
            sensorTypeName: nodeData.sensor_type_name || prev.sensorTypeName,
            domainName: nodeData.domain_name || prev.domainName
          }));

          const ranges = {};
          descriptorArray.forEach((param, index) => {
            const idealArr = nodeData.ideal?.[index]?.[0] || [0, 0];
            const moderateArr = nodeData.moderate?.[index] || [[0, 0], [0, 0]];
            const extremeArr = nodeData.extreme?.[index]?.[0] || [0, 0];

            ranges[param] = {
              ideal: { min: idealArr[0], max: idealArr[1] },
              moderate: { min: moderateArr[0][0], max: moderateArr[0][1] },
              extreme: { min: extremeArr[0], max: extremeArr[1] }
            };
          });

          setParameterRanges(ranges);
          
          const initialFilters = descriptorArray.reduce((acc, param, index) => ({
            ...acc,
            [param]: index < 4
          }), {});
          setSelectedFilters(initialFilters);
          setDisplayFilters(descriptorArray.slice(0, 4));
        })
        .catch((err) => console.error('Error fetching descriptor:', err));
    }
  }, [currentNode?.nodeId, isDomainView, isSensorTypeView, showSensorTypeAnalytics, parameterUnits]);

  useEffect(() => {
    if (currentNode?.nodeId && descriptor.length && !isDomainView && !isSensorTypeView && !showSensorTypeAnalytics) {
      axiosAuthInstance.get(`/nodes/fetch-node-data/?vertical_name=${currentNode.domainName}&node_name=${currentNode.nodeName}`)
        .then((response) => {
          const { data } = response;
          const nodeData = data[0] || {};
          
          const parsedData = nodeData?.data?.map(entry => ({
            timestamp: entry.Timestamp,
            values: descriptor.reduce((acc, param) => {
              acc[param] = entry[param];
              return acc;
            }, {})
          })) || [];
          
          setHistoricalData(parsedData);

          if (parsedData.length) {
            const sums = {};
            const counts = {};
            
            descriptor.forEach(param => {
              sums[param] = 0;
              counts[param] = 0;
            });
            
            parsedData.forEach(entry => {
              descriptor.forEach(param => {
                const value = parseFloat(entry.values[param]);
                if (!Number.isNaN(value)) {
                  sums[param] += value;
                  counts[param] += 1;
                }
              });
            });
            
            const avg = {};
            descriptor.forEach(param => {
              avg[param] = counts[param] > 0 ? (sums[param] / counts[param]).toFixed(2) : null;
            });
            
            setAverages(avg);
          }
        })
        .catch((err) => console.error('Error fetching historical data:', err));
    }
  }, [currentNode, descriptor, isDomainView, isSensorTypeView, showSensorTypeAnalytics]);

  const handleFilterChange = (param) => {
    if (!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 5) return;
    setSelectedFilters(prev => ({ ...prev, [param]: !prev[param] }));
  };

  const applyFilters = () => {
    const selectedParams = descriptor.filter(param => selectedFilters[param]);
    setDisplayFilters(selectedParams.slice(0, 5));
    setFilterOpen(false);
  };

  const getChartData = (filter) => historicalData
  .filter(entry => entry.timestamp)
  .map(entry => ({
    timestamp: entry.timestamp,
    value: entry.values[filter],
    ranges: parameterRanges[filter] || {}
  }));

  const getMapNodes = () => {
    let nodes = [];
    if (isDomainView) {
      nodes = allNodes.filter(n => (n.domain_name ?? n.domainName) === selectedRow.domainName);
    } else if (isSensorTypeView) {
      nodes = allNodes.filter(n => (n.sensor_type_name ?? n.sensorTypeName) === selectedRow.sensorType);
    } else {
      nodes = allNodes.filter(n => n.nodeId === currentNode?.nodeId);
    }

    const sensorTypeColors = {};
    const allSensorTypes = [...new Set(allNodes.map(n => n.sensorTypeName || n.sensor_type_name))];
    
    const hueStep = 360 / allSensorTypes.length;
    allSensorTypes.forEach((type, index) => {
      sensorTypeColors[type] = `hsl(${(hueStep * index) % 360}, 70%, 50%)`;
    });

    return nodes.map(node => ({
      ...node,
      color: sensorTypeColors[node.sensorTypeName || node.sensor_type_name] || '#3388ff'
    }));
  };

  const fetchNodeData = async () => {
    try {
      const response = await axiosAuthInstance.get(
        `/nodes/fetch-node-data/?vertical_name=${currentNode.domainName}&node_name=${currentNode.nodeName}`
      );
      const { data } = response;
      const nodeData = data[0] || {};
      
      const descriptorArray = nodeData?.parameters || [];
      setDescriptor(descriptorArray);
      
      setCurrentNode(prev => ({
        ...prev,
        parameters: nodeData.parameters || [],
        ideal: nodeData.ideal || [],
        moderate: nodeData.moderate || [],
        extreme: nodeData.extreme || [],
        units: nodeData.units || descriptorArray.map(p => parameterUnits[p] || ''),
        sensorTypeId: nodeData.sensortype_id || prev.sensorTypeId,
        verticalId: nodeData.vertical_id || prev.verticalId,
        sensorTypeName: nodeData.sensor_type_name || prev.sensorTypeName,
        domainName: nodeData.domain_name || prev.domainName
      }));
      
      const ranges = {};
      descriptorArray.forEach((param, index) => {
        const idealThreshold = nodeData.ideal?.[index] || { min: 0, max: 0 };
        const moderateThreshold = nodeData.moderate?.[index] || { min: 0, max: 0 };
        const extremeThreshold = nodeData.extreme?.[index] || { min: 0, max: 0 };

        ranges[param] = {
          ideal: idealThreshold,
          moderate: moderateThreshold,
          extreme: extremeThreshold
        };
      });

      setParameterRanges(ranges);
      
      return true;
    } catch (err) {
      console.error('Error fetching node data:', err);
      return false;
    }
  };

  const processNodeDataForDisplay = (nodeData) => {
    if (!nodeData) return null;

    const ranges = {};
    nodeData.parameters.forEach((param, index) => {
      const idealArr = nodeData.ideal?.[index]?.[0] || [0, 0];
      const moderateArr = nodeData.moderate?.[index] || [[0, 0], [0, 0]];
      const extremeArr = nodeData.extreme?.[index]?.[0] || [0, 0];

      ranges[param] = {
        ideal: { min: idealArr[0], max: idealArr[1] },
        moderate: { min: moderateArr[0][0], max: moderateArr[0][1] },
        extreme: { min: extremeArr[0], max: extremeArr[1] }
      };
    });

    return {
      ranges,
      historicalData: (nodeData.data || [])
        .filter(entry => entry.Timestamp && Object.values(entry).some(v => v !== null))
        .map(entry => ({
          timestamp: entry.Timestamp,
          values: nodeData.parameters.reduce((acc, param) => ({
            ...acc,
            [param]: entry[param]
          }), {})
        }))
    };
  };

  useEffect(() => {
    if (currentNode?.nodeId && !isDomainView && !isSensorTypeView && !showSensorTypeAnalytics) {
      const fetchData = async () => {
        try {
          const response = await axiosAuthInstance.get(
            `/nodes/fetch-node-data/?vertical_name=${currentNode.domainName}&node_name=${currentNode.nodeName}`
          );
          const nodeData = response.data[0];
          
          setDescriptor(nodeData.parameters);
          const processedData = processNodeDataForDisplay(nodeData);
          
          setParameterRanges(processedData.ranges);
          setHistoricalData(processedData.historicalData);
          
          setCurrentNode(prev => ({
            ...prev,
            vertical_id: nodeData.vertical_id,
            vertical_name: nodeData.vertical_name,
            sensortype_id: nodeData.sensortype_id,
            sensortype_name: nodeData.sensortype_name,
            parameters: nodeData.parameters,
            ideal: nodeData.ideal,
            moderate: nodeData.moderate,
            extreme: nodeData.extreme,
            units: nodeData.parameters.map(p => parameterUnits[p] || '')
          }));
        } catch (error) {
          console.error('Error fetching node data:', error);
        }
      };

      fetchData();
    }
  }, [currentNode?.nodeId, isDomainView, isSensorTypeView, showSensorTypeAnalytics]);

  if (showSensorTypeAnalytics) {
    const sensorTypeNodes = allNodes.filter(n => n.sensorTypeName === currentSensorType);
    return (
      <SensorTypeAnalytics 
        sensorType={currentSensorType} 
        nodes={sensorTypeNodes} 
        parameterUnits={parameterUnits} 
        onBack={handleBackClick}
      />
    );
  }

  // Register navigation handlers with the chatbot service
  useEffect(() => {
    chatbotNavService.registerNavigationHandlers({
      handleNodeAnalyticsClick: (node, fromSensorTypeView = false) => {
        setViewStack(prev => [...prev, { 
          currentNode, 
          selectedRow,
          fromSensorTypeView
        }]);
        setCurrentNode(node);
        setCardsPage(1);
      },
      handleSensorTypeAnalyticsClick: (sensorType) => {
        setCurrentSensorType(sensorType);
        setShowSensorTypeAnalytics(true);
      },
      setCurrentNode,
      setSelectedRow,
      setShowSensorTypeAnalytics,
      setCurrentSensorType,
      allNodes
    });

    // Set auth context for the navigation service
    chatbotNavService.setAuthContext({ isLoggedIn, user });
    
    // Update auth status
    chatbotNavService.updateAuthStatus(isLoggedIn, user);
  }, [allNodes, currentNode, selectedRow, isLoggedIn, user]);

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleBackClick}
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
          onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#333333';}}  
          onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'black';}}
        >
          <span style={{ fontSize: '1em', color: 'white' }}>←</span>
          <span style={{ color: 'white' }}>Back</span>
        </button>

        {getHeaderTitle()}
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentNode && !isDomainView && !isSensorTypeView && (
            <div className="filter-container" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="filter-button"
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
                <FaFilter /> Filter
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
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8em' }}>
                    Select parameters to display (max 5)
                  </p>
                  {descriptor.map(param => (
                    <div key={param} style={{ marginBottom: '4px' }}>
                      <label 
                        htmlFor={`filter-checkbox-${param}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: selectedFilters[param] || Object.keys(selectedFilters).filter(k => selectedFilters[k]).length < 5 ? 'pointer' : 'not-allowed',
                          opacity: !selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 5 ? 0.5 : 1
                        }}
                      >
                        <input
                          id={`filter-checkbox-${param}`}
                          type="checkbox"
                          checked={selectedFilters[param]}
                          onChange={() => handleFilterChange(param)}
                          disabled={!selectedFilters[param] && Object.keys(selectedFilters).filter(k => selectedFilters[k]).length >= 5}
                          style={{ marginRight: '8px' }}
                        />
                        {param}
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      applyFilters();
                      setShowFilterDropdown(false);
                    }}
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
          )}
        </div> 
      </div>

      {(() => {
        if (isDomainView) {
          if (!nodes.length) return <div>No nodes selected</div>;

          const sensorTypeGroups = {};
          nodes.forEach(node => {
            if (!sensorTypeGroups[node.sensorTypeName]) {
              sensorTypeGroups[node.sensorTypeName] = [];
            }
            sensorTypeGroups[node.sensorTypeName].push(node);
          });

          const sensorTypeCards = Object.entries(sensorTypeGroups).map(([sensorType, sensorNodes]) => (
            <SensorTypeCard
              key={sensorType}
              sensorType={sensorType}
              parameterUnits={parameterUnits}
              nodes={sensorNodes}
              onClickAnalytics={() => handleSensorTypeAnalyticsClick(sensorType)}
            />
          ));

          return (
            <div style={{ display: 'flex', flex: 1, padding: '20px', gap: '20px', height: 'calc(100% - 60px)', overflow: 'hidden' }}>
              <div style={{ flex: 1, height: '90%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Map nodes={getMapNodes()} />
              </div>

              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px', 
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  overflow: 'hidden',
                  paddingBottom: '60px'
                }}>
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    transition: 'opacity 300ms ease', 
                    opacity: transitioning ? 0 : 1
                  }}>
                    {sensorTypeCards.slice((cardsPage - 1) * CARDS_PER_PAGE, cardsPage * CARDS_PER_PAGE)}
                  </div>
                </div>
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '10px 0', 
                  zIndex: 1
                }}>
                  <div className="pagination" style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'center', 
                    background: '#f5f5f5', 
                    padding: '8px 16px', 
                    borderRadius: '30px',
                    marginBottom:'50px'
                  }}>
                    <button
                      type="button"
                      onClick={() => paginateCards(Math.max(1, cardsPage - 1))}
                      disabled={cardsPage === 1}
                      className="arrow-button"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: cardsPage === 1 ? 0.5 : 1,
                        transition: 'opacity 0.2s, transform 0.2s',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <FaChevronLeft size={20} color="#333" />
                    </button>

                    <span style={{ fontFamily: 'Inter, sans-serif', color: '#666', fontSize: '0.9em', minWidth: '60px', textAlign: 'center' }}>
                      {`${cardsPage} / ${Math.max(1, Math.ceil(sensorTypeCards.length / CARDS_PER_PAGE))}`}
                    </span>

                    <button
                      type="button"
                      onClick={() => paginateCards(Math.min(Math.ceil(sensorTypeCards.length / CARDS_PER_PAGE), cardsPage + 1))}
                      disabled={cardsPage === Math.max(1, Math.ceil(sensorTypeCards.length / CARDS_PER_PAGE))}
                      className="arrow-button"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: cardsPage === Math.max(1, Math.ceil(sensorTypeCards.length / CARDS_PER_PAGE)) ? 0.5 : 1,
                        transition: 'opacity 0.2s, transform 0.2s',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <FaChevronRight size={20} color="#333" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (isSensorTypeView) {
          if (!nodes.length) return <div>No nodes selected</div>;

          return (
            <div style={{ display: 'flex', flex: 1, padding: '20px', gap: '20px', height: 'calc(100% - 60px)', overflow: 'hidden' }}>
              <div style={{ flex: 1, height: '90%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Map nodes={getMapNodes()} />
              </div>

              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px', 
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  overflow: 'hidden',
                  paddingBottom: '60px'
                }}>
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    transition: 'opacity 300ms ease', 
                    opacity: transitioning ? 0 : 1,
                  }}>
                    {currentCards.map((node) => (
                      <NodeCard 
                        key={node.nodeId} 
                        node={node} 
                        parameterUnits={parameterUnits} 
                        onClickAnalytics={() => handleNodeAnalyticsClick(node, true)}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '10px 0',  
                  zIndex: 1
                }}>
                  <div className="pagination" style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'center', 
                    background: '#f5f5f5', 
                    padding: '8px 16px', 
                    borderRadius: '30px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '50px'
                  }}>
                    <button
                      type="button"
                      onClick={() => paginateCards(Math.max(1, cardsPage - 1))}
                      disabled={cardsPage === 1}
                      className="arrow-button"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: cardsPage === 1 ? 0.5 : 1,
                        transition: 'opacity 0.2s, transform 0.2s',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <FaChevronLeft size={20} color="#333" />
                    </button>

                    <span style={{ fontFamily: 'Inter, sans-serif', color: '#666', fontSize: '0.9em', minWidth: '60px', textAlign: 'center' }}>
                      {`${cardsPage} / ${Math.max(1, cardsTotalPages)}`}
                    </span>

                    <button
                      type="button"
                      onClick={() => paginateCards(Math.min(cardsTotalPages, cardsPage + 1))}
                      disabled={cardsPage === Math.max(1, cardsTotalPages)}
                      className="arrow-button"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: cardsPage === Math.max(1, cardsTotalPages) ? 0.5 : 1,
                        transition: 'opacity 0.2s, transform 0.2s',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <FaChevronRight size={20} color="#333" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        console.log('currentNode:', currentNode);
        if (currentNode) {
          return (
            <div className="dashboard-containers" style={{ overflow: 'hidden', flex: 1 }}>
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
                            <h3 className="box-title">{filter}</h3>
                            <StatsDisplay 
                              title={filter} 
                              value={historicalData.length > 0 ? 
                                (historicalData[historicalData.length - 1].values[filter] ?? '--') : '--'}
                              unit={parameterUnits[filter] || ''}
                              ranges={parameterRanges[filter]}
                              currentValue={historicalData.length > 0 ? 
                                parseFloat(historicalData[historicalData.length - 1].values[filter]) : null}
                            />
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
                            <h3 className="box-title">{displayFilters[i]}</h3>
                            <TimeSeriesChart 
                              title={displayFilters[i]} 
                              data={getChartData(displayFilters[i])} 
                              ranges={parameterRanges[displayFilters[i]]}
                            />
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

                  <div className="grid-item vertically-divided">
                    <div className="sub-grid-item" style={{ 
                      display: 'flex', 
                      flexDirection: 'row',
                      padding: '0',
                      position: 'relative',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '50%',
                      overflow: 'hidden',
                      marginTop: '-18px'
                    }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        margin: '15px 0 15px 15px',
                        borderRadius: '8px',
                        height: 'calc(100% - 30px)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                        minWidth: 0
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 15px',
                          borderBottom: '1px solid rgba(0,0,0,0.1)'
                        }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: '13px',
                            fontWeight: '600'
                          }}>
                            Node Details
                          </h3>
                          <button
                            type="button"
                            onClick={handleEditThresholds}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'black',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FaEdit size={10} />
                            <span>View Thresholds</span>
                          </button>
                        </div>
                        <div style={{
                          padding: '12px 15px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '4px 10px',
                          fontSize: '11px',
                          lineHeight: '1.6'
                        }}>
                          <div style={{ fontWeight: '600' }}>Domain:</div><div>{nodeDetails?.domain}</div>
                          <div style={{ fontWeight: '600' }}>Sensor Type:</div><div>{nodeDetails?.sensorType}</div>
                          <div style={{ fontWeight: '600' }}>Node Name:</div><div>{nodeDetails?.nodeName}</div>
                          <div style={{ fontWeight: '600' }}>Area:</div><div>{nodeDetails?.area}</div>
                          <div style={{ fontWeight: '600' }}>Coordinates:</div><div>{nodeDetails?.coordinates}</div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '140px',
                        height: '100%',
                        marginRight: '15px'
                      }}>
                        <img
                          src={getDomainIcon(nodeDetails?.domain)}
                          alt="Domain Icon"
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
                          <h3 className="box-title">{displayFilters[4]}</h3>
                          <TimeSeriesChart 
                            title={displayFilters[4]} 
                            data={getChartData(displayFilters[4])} 
                            ranges={parameterRanges[displayFilters[4]]}
                          />
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
                            <h3 className="box-title">{displayFilters[i]}</h3>
                            <TimeSeriesChart 
                              title={displayFilters[i]} 
                              data={getChartData(displayFilters[i])} 
                              ranges={parameterRanges[displayFilters[i]]}
                            />
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

              {showThresholdModel && (
                <ThresholdModel
                  nodeData={{
                    ...currentNode,
                    parameters: currentNode.parameters || [],
                    ideal: currentNode.ideal || [],
                    moderate: currentNode.moderate || [],
                    extreme: currentNode.extreme || [],
                    units: currentNode.units || [],
                    sensorTypeId: currentNode.sensorTypeId,
                    verticalId: currentNode.verticalId,
                    sensorTypeName: currentNode.sensorTypeName,
                    domainName: currentNode.domainName
                  }}
                  onClose={() => setShowThresholdModel(false)}
                  refreshNodeData={fetchNodeData}
                />
              )}
            </div>
          );
        }

        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No node data available</p>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;