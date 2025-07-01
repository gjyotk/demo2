/* eslint-disable */
import React, { useState,useEffect, useContext } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,FormHelperText
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate, useLocation } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
const MySwal = withReactContent(Swal);



function CreateSensorType() {

  const [sensorTypeName, setSensorTypeName] = useState('');
  const [selectedVertical, setSelectedVertical] = useState('');
  const [parameters, setParameters] = useState([]); // All available parameters for the selected vertical
  const [selectedParameters, setSelectedParameters] = useState([]); // User-selected parameters
  const [sensorTypes, setSensorTypes] = useState([]);
  const [baseSensorType, setBaseSensorType] = useState('');
  const { fetchAllVerticals, fetchedVerticals,verticals,fetchUser,user } = useContext(DataContext);
  const [submitted, setSubmitted] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [pdescriptionError, setPDescriptionError] = useState(false);
  const [accuracyError, setAccuracyError] = useState(false);
  const [resolutionError, setResolutionError] = useState(false);
  const [dataTypeError, setDataTypeError] = useState(false);
  const [unitsError, setUnitsError] = useState(false);
  const [sensorTypeNameError, setSensorTypeNameError] = useState(false);
  const [parameterSelectionError, setParameterSelectionError] = useState(false);
  const [verticalError, setVerticalError] = useState(false);
  const [descriptionLimitError, setDescriptionLimitError] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
   
  }, []);

  useEffect(() => {
     if (!fetchedVerticals) fetchAllVerticals();
    fetchUser();
    if (user) {
      // console.log('Fetched user in Vertical.js:', user);
    }
  }, []);

  const validate = () => {
    let isValid = true;

    // Reset error states
    setNameError(false);
    setPDescriptionError(false);
    setAccuracyError(false);
    setResolutionError(false);
    setDataTypeError(false);
    setUnitsError(false);
    setSensorTypeNameError(false);
    setParameterSelectionError(false);
    setVerticalError(false); // reset vertical error
    // Check if sensorTypeName is empty


    if (!selectedVertical) {
      setVerticalError(true);
      isValid = false;
    }
    if (!sensorTypeName) {
      setSensorTypeNameError(true);
      isValid = false;
    } if (selectedParameters.length === 0) {
      setParameterSelectionError(true);
      isValid = false;
    }


    // Check each selected parameter for missing required fields
    selectedParameters.forEach((param) => {
      if (!param.name) {
        setNameError(true);
        isValid = false;
      }
      if (!param.pdescription) {
        setPDescriptionError(true);
        isValid = false;
      }
      if (!param.accuracy) {
        setAccuracyError(true);
        isValid = false;
      }
      if (!param.resolution) {
        setResolutionError(true);
        isValid = false;
      }
      if (!param.dataType) {
        setDataTypeError(true);
        isValid = false;
      }
      if (!param.units) {
        setUnitsError(true);
        isValid = false;
      }
    });

    return isValid;
  };

  const handleVerticalChange = (event) => {
    const selectedVerticalName = event.target.value;
    setSelectedVertical(selectedVerticalName);
  
    // Reset selected parameters when the vertical changes
    setSelectedParameters([]);
    setVerticalError(false);
  
    const vertical = verticals.find((v) => v.name === selectedVerticalName);
    if (vertical) {
      setParameters(vertical.parameters || []);
      axiosAuthInstance.get(`/sensor-types/get/${vertical.id}`)
        .then((response) => {
          setSensorTypes(response.data);
        })
        .catch((error) => {
          if (error.response && error.response.status === 404) {
            // If 404, just ignore or optionally clear sensorTypes
            setSensorTypes([]);
            console.warn("Sensor types not found for this domain.");
          } else {
            // For other errors, optionally log or handle differently
            console.error("Error fetching sensor types:", error);
          }
        });
    } else {
      setParameters([]);
      setSensorTypes([]);
    }
  };
  
  
  const handleSelectedParameterChange = (index, field, value) => {
    setSelectedParameters((prevSelected) => {
      const updatedParameters = [...prevSelected];
  
      if (field === 'name' && !updatedParameters[index].isEditable) {
        return prevSelected; // Don't update name if not editable
      }
  
      if (field === 'pdescription') {
        const wordCount = value.trim().split(/\s+/).length;
        if (wordCount > 20) {
          setDescriptionLimitError(true);
          return prevSelected;
        }
        setDescriptionLimitError(false);
      }
  
      // Updated regex to allow negative numbers and decimal points
      if (field === 'accuracy' || field === 'resolution') {
        // Allow negative sign, numbers and decimal point
        if (value && !/^-?\d*\.?\d*$/.test(value)) {
          return prevSelected;
        }
      }
  
      updatedParameters[index][field] = value;
      return updatedParameters;
    });
  };
  

  const handleParameterSelect = (parameter) => {
    setSelectedParameters((prevSelected) => {
      const isSelected = prevSelected.some((p) => p.name === parameter.name);
      if (isSelected) {
        // If the parameter is already selected, remove it
        return prevSelected.filter((p) => p.name !== parameter.name);
      } else {
        // If the parameter is not selected, add it
        return [
          ...prevSelected,
          {
            name: parameter.name,
            pdescription: parameter.pdescription,
            accuracy: parameter.accuracy || '',  // Default empty values
            units: parameter.units || '',
            resolution: parameter.resolution || '',
            dataType: parameter.datatype || 'string',  // Default data type
          },
        ];
      }
    });
    if (setSelectedParameters.length > 0) {
      setParameterSelectionError(false);
    }
  };

  const handleRemoveSelectedParameter = (index) => {
    setSelectedParameters((prevSelected) => prevSelected.filter((_, i) => i !== index));
  };


  const handleBaseSensorTypeChange = (event) => {
    const selectedBaseType = sensorTypes.find((type) => type.res_name === event.target.value);
    setBaseSensorType(event.target.value);

    if (selectedBaseType) {
      // Map base sensor parameters to the selected parameters
      const formattedParams = selectedBaseType.parameters.map((param, index) => ({
        name: param,
        dataType: selectedBaseType.data_types[index],
        accuracy: '', // Add default values if needed
        units: '',
        resolution: ''
      }));

      // Reset selected parameters and set new ones based on base sensor type
      setSelectedParameters(formattedParams);
    } else {
      // Clear selected parameters when no base sensor type is selected
      setSelectedParameters([]);
    }
  };
const handleSubmit = (e) => {
  e.preventDefault();
  setSubmitted(true);

  if (!validate()) {
    return;
  }

  // Get the selected vertical data
  const selectedVerticalData = verticals.find(v => v.name === selectedVertical);
  if (!selectedVerticalData) return;

  // Create a map of selected parameters for easy lookup
  const selectedParamsMap = {};
  selectedParameters.forEach(param => {
    selectedParamsMap[param.name] = param;
  });

// Create a map of selected/new parameters by name
// Create map from vertical parameters for fallback
const verticalParamMap = parameters.reduce((acc, p) => {
  acc[p.name] = {
    name: p.name,
    pdescription: p.pdescription || '',
    accuracy: p.accuracy || '',
    units: p.units || '',
    resolution: p.resolution || '',
    dataType: p.datatype || 'string'
  };
  return acc;
}, {});

// Merge with selected params to prioritize user-edited values
const selectedMap = selectedParameters.reduce((acc, p) => {
  acc[p.name] = {
    name: p.name,
    pdescription: p.pdescription || '',
    accuracy: p.accuracy || '',
    units: p.units || '',
    resolution: p.resolution || '',
    dataType: p.dataType || 'string'
  };
  return acc;
}, {});

// Final unique list
const allParameterNames = [
  ...new Set([
    ...parameters.map((p) => p.name),
    ...selectedParameters.map((p) => p.name)
  ])
];

// Final merged list with fallback to vertical parameters
const finalParameters = allParameterNames.map(name => {
  return selectedMap[name] || verticalParamMap[name] || { name, dataType: 'string' };
});



  // Data for POST request
  const postData = {
    res_name: sensorTypeName,
    parameters: selectedParameters.map(param => param.name),
    data_types: selectedParameters.map(param => param.dataType),
    vertical_id: selectedVerticalData.id,
    labels: [],
    pdescription: selectedParameters.map(param => param.pdescription),
    accuracy: selectedParameters.map(param => param.accuracy.toString()),
    units: selectedParameters.map(param => param.units),
    resolution: selectedParameters.map(param => param.resolution.toString())
  };

  // Data for PUT request
  const putData = {
    res_name: selectedVerticalData.name,
    res_short_name: selectedVerticalData.res_short_name,
    description: selectedVerticalData.description,
    labels: selectedVerticalData.labels || [],
    name: finalParameters.map(param => param.name),
    data_types: finalParameters.map(param => param.dataType),
    pdescription: finalParameters.map(param => param.pdescription),
    accuracy: finalParameters.map(param => param.accuracy),
    units: finalParameters.map(param => param.units),
    resolution: finalParameters.map(param => param.resolution),
  };


  console.log('PUT Request Data for update-ae:', putData); // Log request data before sending
  // Send both requests using Promise.all
  Promise.all([
    axiosAuthInstance.post('sensor-types/create', postData),
    axiosAuthInstance.put(`/verticals/update-ae/${selectedVerticalData.id}`, putData)
  ])
    .then(([postResponse, putResponse]) => {
         console.log('PUT Response for update-ae:', putResponse.data); // Log response data
      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Sensor Type added and Domain updated successfully.',
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        window.location.reload();
      });
    })
    .catch(error => {
      console.error('Error:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response?.data?.detail || 'An unexpected error occurred.',
      });
    });
};

  const handleAddParameter = () => {
    // For user_type=2, add a new parameter with empty fields that are editable
    const newParameter = {
      name: '',
      pdescription: '',
      accuracy: '',
      units: '',
      resolution: '',
      dataType: '',
      isNew: true,
      isEditable: true  // Add this flag to make name field editable for user_type=2
    };
    
    setSelectedParameters((prevSelected) => [...prevSelected, newParameter]);
  };

  return (
    <Box sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                    {location.pathname !== '/add' && (
  <Box sx={{ mb: 2 }}>
    <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
      <ArrowBackIcon />
    </IconButton>
  </Box>
)}

        </Box>
      <Typography noWrap sx={{ fontSize: '1.5rem' }}>
      <strong>Create New Sensor Type</strong>
      </Typography>

      <FormControl fullWidth margin="normal"error={verticalError}>
  <InputLabel id="select-vertical-label">Select Domain</InputLabel>
  <Select
    labelId="select-vertical-label"
    value={selectedVertical}
    label="Select Vertical"
    onChange={handleVerticalChange}
    MenuProps={{
      PaperProps: {
        style: {
          maxHeight: 200, // Set maximum height for the dropdown
          overflowY: 'auto', // Enable vertical scrolling
        },
      },
    }}
  >
    {verticals.map((vertical) => (
      <MenuItem key={vertical.id} value={vertical.name}>
        {vertical.name}
      </MenuItem>
    ))}
  </Select>
  {verticalError && (
    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
      Please Select Domain.
    </Typography>
  )}
</FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel id="select-base-node-type-label">Base Sensor Type (Optional)</InputLabel>
        <Select
          labelId="select-base-sensor-type-label"
          value={baseSensorType}
          label="Base Sensor Type (Optional)"
          onChange={handleBaseSensorTypeChange}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200, // Set maximum height for the dropdown
                overflowY: 'auto', // Enable vertical scrolling
              },
            },
          }}
        >
          <MenuItem value="">None</MenuItem>
          {sensorTypes.map((type) => (
            <MenuItem key={type.res_name} value={type.res_name}>
              {type.res_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {parameters.length > 0 && (
  <Box sx={{ mt: 3 }}>
    <Typography variant="h6">Select Parameters</Typography>
    {parameterSelectionError && (
      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
        Please select at least one parameter.
      </Typography>
    )}
    <FormGroup>
      {parameters.map((param) => {
        const isSelected = selectedParameters.some((p) => p.name === param.name);
        return (
          <FormControlLabel
            key={param.name}
            control={
              <Checkbox
                checked={isSelected}
                onChange={() => handleParameterSelect(param)}
              />
            }
            label={param.name}
          />
        );
      })}
    </FormGroup>


<Button 
        color="inherit"
        startIcon={<AddCircleOutlineIcon />}   onClick={() => {
          if (user?.user_type === 1) {
              window.location.href = `/datamodel?filter=${encodeURIComponent(selectedVertical)}`;
          } else {
            handleAddParameter();
          }
        }}
       sx={{ mt: 2,
          marginRight: '0.5rem'
         }}>
          Add Parameter
        </Button>

  </Box>
)}


      {selectedParameters.map((param, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          {/* Always show name field for both selected parameters and new parameters */}
          <TextField
            label="Name"
            variant="outlined"
            value={param.name}
            onChange={(e) => handleSelectedParameterChange(index, 'name', e.target.value)}
            // Only disable if it's a selected parameter (not new)
            disabled={!param.isNew}
            sx={{ mr: 1, flex: 1 }}
            error={nameError && !param.name}
            helperText={nameError && !param.name ? "Name is required" : ""}
          />
          
          
          {/* Rest of the parameter fields */}
          <TextField
            label="Parameter Description"
            variant="outlined"
            value={param.pdescription}
            onChange={(e) => handleSelectedParameterChange(index, 'pdescription', e.target.value)}
            sx={{ mr: 1, flex: 1 }}
            error={pdescriptionError && !param.pdescription || descriptionLimitError}
            helperText={(pdescriptionError && !param.pdescription) 
              ? "This field is required" 
              : descriptionLimitError 
              ? "Maximum 20 words allowed" 
              : param.pdescription.trim() 
              ? `${param.pdescription.trim().split(/\s+/).length}/20 words`
              : ""}
          />
          <TextField
            label="Accuracy"
            variant="outlined"
            value={param.accuracy}
            onChange={(e) => handleSelectedParameterChange(index, 'accuracy', e.target.value)}
            sx={{ mr: 1, flex: 1 }}
            error={accuracyError && !param.accuracy}
            helperText={accuracyError && !param.accuracy ? "Enter a number or 'null'" : ""}
            inputProps={{ inputMode: 'decimal', pattern: '[0-9]*' }}
          />
          <TextField
            label="Units"
            variant="outlined"
            value={param.units}
            onChange={(e) => handleSelectedParameterChange(index, 'units', e.target.value)}
            sx={{ mr: 1, flex: 1 }}
            error={unitsError && !param.units}
            helperText={unitsError && !param.units ? "Enter 'null' if Unit not required" : ""}
          />
          <TextField
            label="Resolution"
            variant="outlined"
            value={param.resolution}
            onChange={(e) => handleSelectedParameterChange(index, 'resolution', e.target.value)}
            sx={{ mr: 1, flex: 1 }}
            error={resolutionError && !param.resolution}
            helperText={resolutionError && !param.resolution ? "Enter a number or 'null'" : ""}
            inputProps={{ inputMode: 'decimal', pattern: '[0-9]*' }}
          />
<FormControl variant="outlined" sx={{ mr: 1, flex: 1 }} error={dataTypeError && !param.dataType}>
  <InputLabel>Data Type</InputLabel>
  <Select
    value={param.dataType}
    onChange={(e) => handleSelectedParameterChange(index, 'dataType', e.target.value)}
    label="Data Type"
  >
    <MenuItem value="int">Number</MenuItem>
    <MenuItem value="string">Text</MenuItem>
    <MenuItem value="float">Decimal</MenuItem>
  </Select>
  {dataTypeError && !param.dataType && (
    <FormHelperText>Data Type is required</FormHelperText>
  )}
</FormControl>


          <IconButton onClick={() => handleRemoveSelectedParameter(index)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <TextField
        label="Sensor Type Name"
        variant="outlined"
        value={sensorTypeName}
        onChange={(e) => setSensorTypeName(e.target.value)}
        sx={{ mt: 3, width: '100%' }}
        error={sensorTypeNameError && !sensorTypeName}
        helperText={sensorTypeNameError && !sensorTypeName ? 'Sensor Type Name is required' : ''}
      />

      <Button
        onClick={handleSubmit}
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
      >
        Create Sensor Type
      </Button>
    </Box>
  );
}

export default CreateSensorType;
