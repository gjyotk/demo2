import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Modal,
  LinearProgress,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Ajv from 'ajv';
import Dialog from '@mui/material/Dialog';
import AddAdvanced from './AddAdvanced'; // Adjust the import as needed

import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';

const BulkForm = () => {
  const navigate = useNavigate(); // Initialize the useNa vigate hook
  const { verticals } = useContext(DataContext);
  const [nodes, setNodes] = useState([
    {
      id: 1,
      selectedData: null,
      name: '',
      area: '',
      frequency: '',
      latitude: '',
      longitude: '',
      sensorType: '',
      sensorTypes: [],
      errors: {} // Add errors object to track validation errors
    }
  ]);
  const [importStatus, setImportStatus] = useState({ inProgress: false, message: '' });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });

  const addNode = () => {
    const lastNode = nodes[nodes.length - 1];
    const newNodeId = nodes.length + 1;
    setNodes([
      ...nodes,
      {
        id: newNodeId,
        selectedData: lastNode?.selectedData || null,
        name: '',
        area: lastNode?.area || '',
        frequency: '',
        latitude: '',
        longitude: '',
        protocol: '',
        sensorType: lastNode?.sensorType || '',
        sensorTypes: lastNode?.sensorTypes || [],
        errors: {} // Initialize empty errors object for the new node
      }
    ]);
  };

  const removeNode = (nodeId) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
  };

  const fetchSensorTypes = (domainId, index) => {
    axiosAuthInstance
      .get(`/sensor-types/get/${domainId}`)
      .then((response) => {
        const updatedNodes = [...nodes];
        updatedNodes[index].sensorTypes = response.data;
        setNodes(updatedNodes);
      })
      .catch((err) => {
        console.error('Error fetching sensor types:', err);
      });
  };

  const validateCoordinates = async (latitude, longitude, index) => {
    // Validate format first (without making API call)
    const latRegex = /^-?([0-8]?[0-9]|90)(\.[0-9]{1,20})?$/;
    const lngRegex = /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,20})?$/;

    const updatedNodes = [...nodes];
    let hasError = false;

    // Clear previous errors
    updatedNodes[index].errors = updatedNodes[index].errors || {};

    // Perform format validation
    if (latitude && !latRegex.test(latitude)) {
      updatedNodes[index].errors.latitude = 'Latitude must be between -90 and 90 degrees';
      hasError = true;
    } else {
      delete updatedNodes[index].errors.latitude;
    }

    if (longitude && !lngRegex.test(longitude)) {
      updatedNodes[index].errors.longitude = 'Longitude must be between -180 and 180 degrees';
      hasError = true;
    } else {
      delete updatedNodes[index].errors.longitude;
    }

    // If either validation failed or fields are empty, don't proceed with geocoding
    if (hasError || !latitude || !longitude) {
      setNodes(updatedNodes);
      return;
    }

    try {
      // Set a timeout to prevent hanging on network requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Verify the coordinates correspond to a real location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { signal: controller.signal }
      ).catch(error => {
        // Handle network errors specifically
        console.error('Network error when validating location:', error);
        throw new Error('Network error: Unable to validate location due to connectivity issues');
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Location validation failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.display_name) {
        updatedNodes[
          index
        ].errors.coordinates = `Invalid location: these coordinates do not correspond to a valid location`;
        setNodes([...updatedNodes]);
        return;
      }

      // Check if the coordinates match the area entered by the user
      const areaName = updatedNodes[index].area.trim().toLowerCase();
      if (areaName) {
        // Get location data from the API response
        const locationData = data.display_name.toLowerCase();
        const addressParts = [
          data.address?.city,
          data.address?.town,
          data.address?.village,
          data.address?.county,
          data.address?.state,
          data.address?.country
        ]
          .filter(Boolean)
          .map((part) => part.toLowerCase());

        // Check if any part of the address matches the area name
        const areaMatches =
          addressParts.some((part) => part.includes(areaName)) || locationData.includes(areaName);

        if (!areaMatches) {
          updatedNodes[
            index
          ].errors.coordinates = `The coordinates don't seem to match the area "${updatedNodes[index].area}". Please verify your location.`;
        } else {
          // Clear coordinates error if it exists
          if (updatedNodes[index].errors.coordinates) {
            delete updatedNodes[index].errors.coordinates;
          }
          console.log(`Location validated: ${data.display_name} matches area ${areaName}`);
        }
      } else {
        // Clear coordinates error if it exists
        if (updatedNodes[index].errors.coordinates) {
          delete updatedNodes[index].errors.coordinates;
        }
        console.log(`Location validated: ${data.display_name}`);
      }

      setNodes([...updatedNodes]);
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Provide more specific error message based on error type
      if (error.name === 'AbortError') {
        updatedNodes[index].errors.coordinates = 'Location validation timed out. Please try again later.';
      } else if (error.message.includes('Network error')) {
        // Network error - provide fallback behavior
        console.log('Network error - skipping online validation');
        
        // Clear coordinates error since we can't validate online, but format is correct
        delete updatedNodes[index].errors.coordinates;
        
        // Add a warning instead of an error
        updatedNodes[index].warning = 'Unable to validate location online due to network issues. Form can still be submitted.';
      } else {
        updatedNodes[index].errors.coordinates = 'Error validating location. Please try again later.';
      }
      
      setNodes([...updatedNodes]);
    }
  };

  // Update handleChange function to also clear warnings when appropriate
  const handleChange = async (index, field, value) => {
    const updatedNodes = [...nodes];
    updatedNodes[index][field] = value;

    // Initialize errors object if it doesn't exist
    updatedNodes[index].errors = updatedNodes[index].errors || {};
    
    // Clear warnings when making changes
    if (updatedNodes[index].warning) {
      delete updatedNodes[index].warning;
    }

    // Validate individual field format
    if (field === 'latitude') {
      const latRegex = /^-?([0-8]?[0-9]|90)(\.[0-9]{1,20})?$/;
      if (value && !latRegex.test(value)) {
        updatedNodes[index].errors.latitude = 'Latitude must be between -90 and 90 degrees';
      } else {
        delete updatedNodes[index].errors.latitude;
      }
    }

    if (field === 'longitude') {
      const lngRegex = /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,20})?$/;
      if (value && !lngRegex.test(value)) {
        updatedNodes[index].errors.longitude = 'Longitude must be between -180 and 180 degrees';
      } else {
        delete updatedNodes[index].errors.longitude;
      }
    }

    setNodes(updatedNodes);

    const { latitude, longitude } = updatedNodes[index]; // Removed 'area' from destructuring since it's not used here

    // Area changed - validate coordinates again if they exist
    if (
      field === 'area' &&
      latitude &&
      longitude &&
      /^-?([0-8]?[0-9]|90)(\.[0-9]{1,20})?$/.test(latitude) &&
      /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,20})?$/.test(longitude)
    ) {
      await validateCoordinates(latitude, longitude, index);
    }

    // Coordinates changed - validate with API if both lat and long are filled and in correct format
    if (
      (field === 'latitude' || field === 'longitude') &&
      latitude &&
      longitude &&
      /^-?([0-8]?[0-9]|90)(\.[0-9]{1,20})?$/.test(latitude) &&
      /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,20})?$/.test(longitude)
    ) {
      await validateCoordinates(latitude, longitude, index);
    }

    if (field === 'selectedData') {
      fetchSensorTypes(value, index);
    }
  };

  const nodesSchema = {
    title: 'Nodes',
    type: 'object',
    required: ['nodes'],
    properties: {
      nodes: {
        type: 'array',
        title: 'Nodes',
        items: {
          type: 'object',
          required: [
            'latitude',
            'longitude',
            'area',
            'sensor_type',
            'domain',
            'name',
            'protocol',
            'frequency'
          ],
          properties: {
            latitude: {
              type: 'number',
              title: 'Latitude'
            },
            frequency: {
              type: 'string',
              title: 'frequency'
            },
            longitude: {
              type: 'number',
              title: 'Longitude'
            },
            area: {
              type: 'string',
              title: 'Area'
            },
            protocol: {
              type: 'string',
              title: 'Area'
            },
            sensor_type: {
              type: 'string',
              title: 'Sensor Name'
            },
            domain: {
              type: 'string',
              title: 'Domain'
            },
            name: {
              type: 'string',
              title: 'Name'
            }
            // frequency: {
            //   type: 'time',
            //   title: 'Frequency'
            // },
          }
        }
      }
    }
  };

  const ajv = new Ajv();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const simulateLoadingProgress = (callback) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
        callback();
      }
      setLoadingProgress(progress);
    }, 200);
  };

  const handleBulkImport = () => {
    // Check for validation errors before submitting, but ignore coordinate errors if there's a network warning
    const hasValidationErrors = nodes.some(
      (node) => {
        // If there's a network warning, ignore coordinate errors
        if (node.warning && node.errors?.coordinates) {
          const { coordinates, ...otherErrors } = node.errors;
          return Object.keys(otherErrors).length > 0;
        }
        return node.errors && Object.keys(node.errors).length > 0;
      }
    );

    if (hasValidationErrors) {
      setErrorModal({
        open: true,
        message:
          'Please fix the validation errors before submitting. Some coordinates may not match their areas or have format issues.'
      });
      return;
    }

    const hasEmptyFields = nodes.some(
      (node) =>
        !node.selectedData ||
        !node.name ||
        !node.area ||
        !node.frequency ||
        !node.latitude ||
        !node.longitude ||
        !node.protocol ||
        !node.sensorType
    );

    if (hasEmptyFields) {
      setErrorModal({ open: true, message: 'Please fill in all the required fields.' });
      return;
    }

    const nodesData = nodes.map((node) => ({
      latitude: parseFloat(node.latitude),
      longitude: parseFloat(node.longitude),
      area: node.area,
      frequency: node.frequency,
      protocol: node.protocol,
      sensor_type: node.sensorTypes.find((sensorType) => sensorType.id === node.sensorType)
        .res_name,
      domain: verticals.find((vertical) => vertical.id === node.selectedData).name,
      name: node.name
    }));

    const data = {
      nodes: nodesData
    };

    try {
      // Validate the data against the schema
      const validate = ajv.compile(nodesSchema);
      const valid = validate(data);

      if (valid) {
        setImportStatus({ inProgress: true, message: 'Import in progress...' });
        setModalOpen(true);
        setLoadingProgress(0);

        simulateLoadingProgress(() => {
          axiosAuthInstance
            .post('/import/import', data)
            .then((response) => {
              console.log('Import response:', response.data);
              const {
                created_nodes: createdNodes = [],
                failed_nodes: failedNodes = [],
                invalid_sensor_nodes: invalidSensorNodes = []
              } = response.data;
              let message = `Import completed.\n`;
              message += `Created nodes: ${createdNodes.length}\n`;
              message += `Failed nodes: ${failedNodes.length}\n`;
              message += `Invalid sensor nodes: ${invalidSensorNodes.length}\n\n`;

              if (failedNodes.length > 0) {
                message += `Failed nodes:\n`;
                failedNodes.forEach((node, index) => {
                  // Enhanced error message formatting with full error capture
                  let errorDetails = node.error;

                  // Handle different error formats and ensure we get the full message
                  if (typeof node.error === 'object' && node.error !== null) {
                    if (node.error.message) {
                      errorDetails = node.error.message;
                    } else if (node.error.detail) {
                      errorDetails = node.error.detail;
                    } else {
                      errorDetails = JSON.stringify(node.error);
                    }
                  }

                  // Extract the detailed error if it's truncated at "Exception occurred:"
                  if (
                    typeof errorDetails === 'string' &&
                    errorDetails.includes('Exception occurred:')
                  ) {
                    const errorParts = errorDetails.split('Exception occurred:');
                    if (errorParts.length > 1 && errorParts[1].trim()) {
                      errorDetails = `Exception occurred: ${errorParts[1].trim()}`;
                    }
                  }

                  // Add more detailed information about the node that failed
                  message += `${index + 1}. ${
                    node.node.name || 'Unknown'
                  }, Error: ${errorDetails}\n`;
                  if (node.node) {
                    message += `   Domain: ${node.node.domain}, Sensor Type: ${node.node.sensor_type}\n`;

                    // Add more node details if available
                    if (node.node.area) {
                      message += `   Area: ${node.node.area}\n`;
                    }
                    if (node.node.protocol) {
                      message += `   Protocol: ${node.node.protocol}\n`;
                    }
                    if (node.node.frequency) {
                      message += `   Frequency: ${node.node.frequency}\n`;
                    }
                    if (node.node.latitude && node.node.longitude) {
                      message += `   Location: ${node.node.latitude}, ${node.node.longitude}\n`;
                    }
                  }
                  // Add a separator between nodes for better readability
                  message += '\n';
                });
              }
              message += '\n';

              if (invalidSensorNodes.length > 0) {
                message += `Invalid sensor nodes:\n`;
                invalidSensorNodes.forEach((node, index) => {
                  // Enhanced error message formatting for invalid sensors
                  let errorDetails = node.error;

                  // Handle different error formats
                  if (typeof node.error === 'object' && node.error !== null) {
                    if (node.error.message) {
                      errorDetails = node.error.message;
                    } else if (node.error.detail) {
                      errorDetails = node.error.detail;
                    } else {
                      errorDetails = JSON.stringify(node.error);
                    }
                  }
                  message += `${index + 1}. ${
                    node.node.name || 'Unknown'
                  }, Error: ${errorDetails}\n`;
                  if (node.node) {
                    message += `   Domain: ${node.node.domain}, Sensor Type: ${node.node.sensor_type}\n\n`;
                  }
                });
              }

              if (createdNodes.length > 0) {
                console.log(createdNodes);
                message += `Created nodes:\n`;

                createdNodes.forEach((node, index) => {
                  console.log(index, node);
                  message += `${index + 1}. ${node}\n`;
                });
              }

              setImportStatus({ inProgress: false, message });
              if (createdNodes.length === nodes.length) {
                // Show the popup first
                setModalOpen(true);
                setImportStatus({ inProgress: false, message });

                // Wait for 2 seconds before redirecting
                setTimeout(() => {
                  navigate('/details?filter=all');
                }, 2000);
              }
            })
            .catch((error) => {
              console.error('Import failed:', error);
              let errorMessage = 'Failed to import nodes. Please try again.';

              // Extract more detailed error information from the response
              if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                  errorMessage += `\n\nServer Error: ${error.response.data}`;
                } else if (error.response.data.message) {
                  errorMessage += `\n\nServer Error: ${error.response.data.message}`;
                } else if (error.response.data.error) {
                  errorMessage += `\n\nServer Error: ${error.response.data.error}`;
                }
              }

              setImportStatus({
                inProgress: false,
                message: errorMessage
              });
            });
        });
      } else {
        // Data is invalid according to the schema
        console.error('Invalid JSON data:', validate.errors);
        console.log(data);

        let errorMessage =
          'The JSON data is not in the correct format. Please check the following issues:\n\n';
        validate.errors.forEach((err, index) => {
          errorMessage += `${index + 1}. ${err.message} at ${err.dataPath || 'root'}\n`;
        });

        setErrorModal({ open: true, message: errorMessage });
      }
    } catch (error) {
      // Handle parsing errors
      console.error('Error parsing JSON data:', error);
      setErrorModal({
        open: true,
        message: `Invalid JSON format: ${error.message}. Please check and try again.`
      });
    }
  };

  const handleChangefrequency = (index, field, value) => {
    const updatedNodes = [...nodes];
    updatedNodes[index][field] = value;
    setNodes(updatedNodes);
  };

  const handleBlur = (index, field, value) => {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    if (value && !timeRegex.test(value)) {
      alert('Please enter a valid time in HH:MM:SS format');
    }
  };

  return (
    <Box sx={{ padding: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header section with title and button on same line - stays fixed */}
      <Box>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Typography noWrap sx={{ fontSize: '1.5rem' }}>
              <strong>Create New Node</strong>
            </Typography>
          </Grid>
          
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpen}
              startIcon={<CloudUploadIcon />}>
              Bulk Import
            </Button>
          </Grid>
        </Grid>
        
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
          <AddAdvanced handleClose={handleClose} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px' }}>
            <Button onClick={handleClose} variant="outlined" color="secondary">
              Close
            </Button>
          </div>
        </Dialog>
      </Box>
      
      {/* Scrollable form section */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          maxHeight: 'calc(100vh - 240px)', 
          mb: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '4px',
          },
        }}
      >
        {nodes.map((node) => (
          <Paper key={node.id} sx={{ padding: 3, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id={`domain-label-${node.id}`}>Select Domain</InputLabel>
                  <Select
                    labelId={`domain-label-${node.id}`}
                    value={node.selectedData || ''}
                    onChange={(e) =>
                      handleChange(nodes.indexOf(node), 'selectedData', e.target.value)
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 200, // Set maximum height for the dropdown
                          overflowY: 'auto' // Enable vertical scrolling
                        }
                      }
                    }}
                    label="Select Domain">
                    {verticals.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id={`sensor-type-label-${node.id}`}>Select Sensor Type</InputLabel>
                  <Select
                    labelId={`sensor-type-label-${node.id}`}
                    value={node.sensorType || ''}
                    onChange={(e) => handleChange(nodes.indexOf(node), 'sensorType', e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 200, // Set maximum height for the dropdown
                          overflowY: 'auto' // Enable vertical scrolling
                        }
                      }
                    }}
                    label="Select Sensor Type">
                    {node.sensorTypes &&
                      node.sensorTypes.map((sensorType) => (
                        <MenuItem key={sensorType.id} value={sensorType.id}>
                          {sensorType.res_name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  variant="outlined"
                  value={node.name}
                  onChange={(e) => handleChange(nodes.indexOf(node), 'name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Area"
                  variant="outlined"
                  value={node.area}
                  onChange={(e) => handleChange(nodes.indexOf(node), 'area', e.target.value)}
                  helperText=""
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  variant="outlined"
                  value={node.latitude}
                  onChange={(e) => handleChange(nodes.indexOf(node), 'latitude', e.target.value)}
                  error={!!node.errors?.latitude}
                  helperText={node.errors?.latitude}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  variant="outlined"
                  value={node.longitude}
                  onChange={(e) => handleChange(nodes.indexOf(node), 'longitude', e.target.value)}
                  error={!!node.errors?.longitude}
                  helperText={node.errors?.longitude}
                />
              </Grid>
              {/* Add coordinates error message if it exists */}
              {node.errors?.coordinates && (
                <Grid item xs={12}>
                  <FormHelperText error sx={{ fontSize: '0.875rem', mt: -1, mb: 1 }}>
                    {node.errors.coordinates}
                  </FormHelperText>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Protocol"
                  variant="outlined"
                  value={node.protocol}
                  onChange={(e) => handleChange(nodes.indexOf(node), 'protocol', e.target.value)}>
                  <MenuItem value="HTTP">HTTP</MenuItem>
                  <MenuItem value="MQTT">MQTT</MenuItem>
                  <MenuItem value="COAP">COAP</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Frequency"
                  variant="outlined"
                  type="time"
                  value={node.frequency || ''}
                  onChange={(e) =>
                    handleChangefrequency(nodes.indexOf(node), 'frequency', e.target.value)
                  }
                  onBlur={(e) => handleBlur(nodes.indexOf(node), 'frequency', e.target.value)}
                  inputProps={{
                    step: 1
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
            </Grid>

            {/* Display warning message if exists */}
            {node.warning && (
              <Box sx={{ mt: 2, p: 1, backgroundColor: '#fff3cd', borderRadius: 1 }}>
                <Typography color="warning" variant="body2">
                  Note: {node.warning}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeNode(node.id)}
                startIcon={<DeleteIcon />}>
                Delete Node
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
      
      {/* Footer buttons - stays fixed */}
      <Box>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Button variant="contained" onClick={addNode} startIcon={<AddIcon />}>
              Add Form
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBulkImport}
              disabled={importStatus.inProgress}>
              {importStatus.inProgress ? 'Importing...' : 'Add Node(S)'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 600,
            p: 4,
            borderRadius: 2
          }}>
          <Typography variant="h6" gutterBottom>
            Import Status
          </Typography>
          {importStatus.inProgress && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={loadingProgress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {`${Math.round(loadingProgress)}%`}
              </Typography>
            </Box>
          )}
          <Typography sx={{ mt: 2, whiteSpace: 'pre-line' }}>{importStatus.message}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </Box>
        </Paper>
      </Modal>
      <Modal open={errorModal.open} onClose={() => setErrorModal({ open: false, message: '' })}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 400,
            p: 4,
            borderRadius: 2
          }}>
          <Typography variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography>{errorModal.message}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={() => setErrorModal({ open: false, message: '' })}>
              Close
            </Button>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

export default BulkForm;
