import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {  IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosAuthInstance } from '../services/axiosConfig';
import { DataContext } from '../contexts/DataContext';




const MySwal = withReactContent(Swal);

export default function MultipleSelect() {
  const { fetchAllVerticals } = useContext(DataContext);
  const [VerticalName, setVerticalName] = useState('');
  const [VerticalShortName, setVerticalShortName] = useState('');
  const [VerticalShortNameError, setVerticalShortNameError] = useState(0);
  const [Description, setDescription] = useState('');
  const [VerticalNameError, setVerticalNameError] = useState(false);
  const [DescriptionError, setDescriptionError] = useState(false);
  const [parameters, setParameters] = useState([{ id: Date.now() + Math.random(), dataType: '' }]);
  const [parameterErrors, setParameterErrors] = useState({});
  // const [version, setVersion] = useState('V1.0.0');  // State to manage version number
  const location = useLocation();

  const navigate = useNavigate();
  const handleAddParameter = () => {
    setParameters((prev) => [...prev, { id: Date.now() + Math.random(), dataType: '' }]);
  };

  const handleDeleteParameter = (id) => {
    setParameters((prev) => prev.filter(param => param.id !== id));
  };

  // const handleVersionChange = (e) => {
  //   const versionValue = e.target.value;
  //   // Ensure the version format is valid (e.g., v1.2.3)
  //   if (/^V\d+\.\d+\.\d+$/.test(versionValue) || versionValue === '') {
  //     setVersion(versionValue); // Update version only if valid format
  //   }
  // };
  const handleAddVerticalName = () => {
    let isValid = true;
    const newParameterErrors = {};
  
    // Validate domain name
    if (!VerticalName) {
      setVerticalNameError(true);
      isValid = false;
    } else {
      setVerticalNameError(false);
    }
  
    // Validate domain short name
    if (!VerticalShortName) {
      setVerticalShortNameError(1);
      isValid = false;
    } else if (VerticalShortName.length > 2) {
      setVerticalShortNameError(2);
      isValid = false;
    } else {
      setVerticalShortNameError(0);
    }
  
    // Validate description
    if (!Description) {
      setDescriptionError(true);
      isValid = false;
    } else {
      setDescriptionError(false);
    }
  
    // Validate parameters
    parameters.forEach(({ id, dataType }) => {
      const paramName = document.getElementById(`parameter-name-${id}`).value;
      const paramdescription = document.getElementById(`paramdescription-${id}`).value;
      const accuracy = document.getElementById(`accuracy-${id}`).value;
      const unit = document.getElementById(`unit-${id}`).value;
      const resolution = document.getElementById(`resolution-${id}`).value;
  
      // Initialize the errors for each parameter
      newParameterErrors[id] = {};
  
      if (!paramName) {
        newParameterErrors[id].paramName = "Parameter Name is required";
        isValid = false;
      }
      if (!paramdescription) {
        newParameterErrors[id].paramdescription = "Enter 'null' if Parameter Description not required";
        isValid = false;
      }
  
      if (!accuracy) {
        newParameterErrors[id].accuracy = "Enter 'null' if Accuracy not required";
        isValid = false;
      }
  
      if (!unit) {
        newParameterErrors[id].unit = "Enter 'null' if Unit not required";
        isValid = false;
      }
  
      if (!resolution) {
        newParameterErrors[id].resolution = "Enter 'null' if Resolution not required";
        isValid = false;
      }
  
      if (!dataType) {
        newParameterErrors[id].dataType = "Data Type is required";
        isValid = false;
      }
    });
  
    setParameterErrors(newParameterErrors);
  
    if (!isValid) return;
  
    // Proceed with the API request if everything is valid
    const requestPayload = {
      res_name: VerticalName,
      res_short_name: VerticalShortName,
      description: Description,
      labels: [],
      orid: "",
      name: parameters.map(({ id }) => document.getElementById(`parameter-name-${id}`).value),
      data_types: parameters.map(({ dataType }) => dataType),
      pdescription: parameters.map(({ id }) => document.getElementById(`paramdescription-${id}`).value),
      accuracy: parameters.map(({ id }) => document.getElementById(`accuracy-${id}`).value),
      units: parameters.map(({ id }) => document.getElementById(`unit-${id}`).value),
      resolution: parameters.map(({ id }) => document.getElementById(`resolution-${id}`).value),
    };

    console.log('Sending request payload:', {
      url: '/verticals/create-ae',
      data: requestPayload
    });

    axiosAuthInstance
      .post('/verticals/create-ae', requestPayload)
      .then((response) => {

        console.log('API Response:', response.data);
        if (response.data.status_code === 201) {
          MySwal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Domain added successfully.',
            showConfirmButton: false,
            timer: 1500,
          });
          window.location.reload();
        }
        fetchAllVerticals();
      })
      .catch((error) => {
        console.log(error, error.response.data);
        if (error.response.status === 409) {
          MySwal.fire({
            icon: 'warning',
            title: 'Domain already exists!',
          });
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Oops...',
            text: error.response.data.detail,
          });
        }
      });
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
        <strong>Create New Domain</strong>
      </Typography>

      {/* Domain Name Input */}
      <TextField
        id="text-field"
        label="Domain Name"
        variant="outlined"
        fullWidth
        sx={{ m: 1 }}
        value={VerticalName}
        onChange={(e) => {
          setVerticalName(e.target.value);
          setVerticalNameError(false);
        }}
        error={VerticalNameError}
        helperText={VerticalNameError ? 'Domain Name is required' : ''}
      />
<TextField
  id="text-field2"
  label="Domain Short Name"
  variant="outlined"
  fullWidth
  sx={{ m: 1 }}
  value={VerticalShortName}
  onChange={(e) => {
    setVerticalShortName(e.target.value);
    setVerticalShortNameError(0);
  }}
  error={VerticalShortNameError > 0}
  helperText={(() => {
    switch (VerticalShortNameError) {
      case 1:
        return 'Domain Short Name is required';
      case 2:
        return 'Domain Short Name should be 2 characters';
      default:
        return '';
    }
  })()}
/>

      {/* Description Input */}
      <TextField
        id="text-field1"
        label="Description"
        variant="outlined"
        fullWidth
        multiline
        sx={{ m: 1 }}
        rows={4}
        value={Description}
        onChange={(e) => {
          setDescription(e.target.value);
          setDescriptionError(false);
        }}
        error={DescriptionError}
        helperText={DescriptionError ? 'Description is required' : ''}
      />

      {/* Version Input */}
      {/* <TextField
  label="Version (VX.YY.ZZ)"
  variant="outlined"
  fullWidth
  sx={{ m: 1 }}
  value={version}
  onChange={(e) => {
    const versionValue = e.target.value;
    const regex = /^V\d+\.\d+\.\d+$/;

    // Allow update only if the format is V followed by three numbers separated by dots
    if (regex.test(versionValue) || versionValue === '') {
      setVersion(versionValue); // Update version if valid format
    }
  }}
  error={!/^V\d+\.\d+\.\d+$/.test(version)}
  helperText={!/^V\d+\.\d+\.\d+$/.test(version) ? 'Version must be in the format V1.0.0' : ''}
  InputProps={{
    inputMode: 'text',  // Allows text input (including numbers and periods)
  }}
/> */}
<strong>Add Data Model</strong>
      {/* Render parameter blocks dynamically */}
      {parameters.map((param) => (
  <Box key={param.id} sx={{ display: 'flex', alignItems: 'center', mt: 2, m: 1 }}>
    
    <TextField
      id={`parameter-name-${param.id}`}
      label="Parameter Name"
      variant="outlined"
      fullWidth
      sx={{ mr: 1, flex: 1 }}
      error={parameterErrors[param.id]?.paramName}
      helperText={parameterErrors[param.id]?.paramName}
      onChange={(e) => {
        const newParams = parameters.map((p) =>
          p.id === param.id ? { ...p, name: e.target.value } : p
        );
        setParameters(newParams);
        setParameterErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (e.target.value && newErrors[param.id]?.paramName) {
            delete newErrors[param.id].paramName;
          }
          return newErrors;
        });
      }}
    />
     <TextField
      id={`paramdescription-${param.id}`}
      label="Parameter Description"
      variant="outlined"
      fullWidth
      sx={{ mr: 1, flex: 1 }}
      error={parameterErrors[param.id]?.paramdescription}
      helperText={parameterErrors[param.id]?.paramdescription}
      onChange={(e) => {
        const newParams = parameters.map((p) =>
          p.id === param.id ? { ...p, paramdescription: e.target.value } : p
        );
        setParameters(newParams);
        setParameterErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (e.target.value && newErrors[param.id]?.paramdescription) {
            delete newErrors[param.id].paramdescription;
          }
          return newErrors;
        });
      }}
    />
    <TextField
      id={`accuracy-${param.id}`}
      label="Accuracy"
      variant="outlined"
      fullWidth
      sx={{ mr: 1, flex: 1 }}
      error={parameterErrors[param.id]?.accuracy}
      helperText={parameterErrors[param.id]?.accuracy}
      onChange={(e) => {
        const newParams = parameters.map((p) =>
          p.id === param.id ? { ...p, accuracy: e.target.value } : p
        );
        setParameters(newParams);
        setParameterErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (e.target.value && newErrors[param.id]?.accuracy) {
            delete newErrors[param.id].accuracy;
          }
          return newErrors;
        });
      }}
    />
    <TextField
      id={`unit-${param.id}`}
      label="Unit"
      variant="outlined"
      fullWidth
      sx={{ mr: 1, flex: 1 }}
      error={parameterErrors[param.id]?.unit}
      helperText={parameterErrors[param.id]?.unit}
      onChange={(e) => {
        const newParams = parameters.map((p) =>
          p.id === param.id ? { ...p, unit: e.target.value } : p
        );
        setParameters(newParams);
        setParameterErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (e.target.value && newErrors[param.id]?.unit) {
            delete newErrors[param.id].unit;
          }
          return newErrors;
        });
      }}
    />
    <TextField
      id={`resolution-${param.id}`}
      label="Resolution"
      variant="outlined"
      fullWidth
      sx={{ mr: 1, flex: 1 }}
      error={parameterErrors[param.id]?.resolution}
      helperText={parameterErrors[param.id]?.resolution}
      onChange={(e) => {
        const newParams = parameters.map((p) =>
          p.id === param.id ? { ...p, resolution: e.target.value } : p
        );
        setParameters(newParams);
        setParameterErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (e.target.value && newErrors[param.id]?.resolution) {
            delete newErrors[param.id].resolution;
          }
          return newErrors;
        });
      }}
    />
          <FormControl sx={{ mr: 1, minWidth: 120 }} error={!!parameterErrors[param.id]?.dataType}>
  <InputLabel>Data Type</InputLabel>
  <Select
    label="Data Type"
    value={param.dataType}
    onChange={(e) => {
      const newParams = parameters.map((p) =>
        p.id === param.id ? { ...p, dataType: e.target.value } : p
      );
      setParameters(newParams);
      // Clear error for dataType when a valid value is selected
      setParameterErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (newErrors[param.id]?.dataType) {
          delete newErrors[param.id].dataType;
        }
        return newErrors;
      });
    }}
  >
    <MenuItem value="int">Number</MenuItem>
    <MenuItem value="string">Text</MenuItem>
    <MenuItem value="float">Decimal</MenuItem>
  </Select>
  {parameterErrors[param.id]?.dataType && (
    <Typography variant="caption" color="error">
      {parameterErrors[param.id].dataType}
    </Typography>
  )}
</FormControl>

          <IconButton onClick={() => handleDeleteParameter(param.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      {/* Add New Parameter */}
      <Button color="inherit"
        startIcon={<AddCircleOutlineIcon />} onClick={handleAddParameter} sx={{ mt: 2,
          marginRight: '0.5rem'
         }}>
          Add Parameter
      </Button>

      {/* Submit Button */}
      <Button
        
        onClick={handleAddVerticalName}
        sx={{ mt: 3 }}
        variant="contained"
      >
        Add Domain
      </Button>
    </Box>
  );
}
