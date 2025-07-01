/* eslint-disable */
import React, { useState, useContext, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import TurnedInIcon from '@mui/icons-material/TurnedIn';
import Fab from '@mui/material/Fab';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';
import CreateIcon from '@mui/icons-material/Create';
import { useLocation } from 'react-router-dom';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
const MySwal = withReactContent(Swal);


function DataModel() {
  const location = useLocation();
  const filter = new URLSearchParams(location.search).get('filter'); // Get the vertical ID from URL
  const [selectedVertical, setSelectedVertical] = useState('');
  const [parameters, setParameters] = useState([]);

  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [editable, setEditable] = useState(false);
  const [isModifyConfirmed, setIsModifyConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  // const [ setVerticals] = useState([]);
  const { verticals, fetchAllVerticals, fetchedVerticals } = useContext(DataContext);

  useEffect(() => {
    if (!fetchedVerticals) {
      fetchAllVerticals();
    }
  }, [fetchedVerticals, fetchAllVerticals]);

  
  
  useEffect(() => {
    console.log("vertical", verticals.length);
    if (verticals.length > 0) {
      console.log(verticals)
      // No need for another API call, as verticals are already fetched and set
      const initialVertical = verticals.find((v) => {
        const resName = v.name?.trim().toLowerCase() || '';
        const description = v.description?.trim().toLowerCase() || '';
        const filterTrimmed = filter.trim().toLowerCase();
        
        return resName === filterTrimmed || description === filterTrimmed;
      });
  
      if (initialVertical) {
        setSelectedVertical(initialVertical.name || initialVertical.description);
        setParameters(initialVertical.parameters || []);
      } else {
        console.log('Domain not found for filter:', filter);
        setSelectedVertical('');
        setParameters([]);
      }
    }
  }, [filter, verticals]);
  

  
  const validateFields = () => {
    const newErrors = {};
  
    parameters.forEach((param, index) => {
      if (!param.name) newErrors[`name-${index}`] = 'This field is required';
      if (!param.data_type) newErrors[`data_type-${index}`] = 'This field is required';
      if (!param.pdescription) newErrors[`pdescription-${index}`] = 'This field is required';
      if (!param.accuracy) newErrors[`accuracy-${index}`] = 'Enter null if not required';
      if (!param.units) newErrors[`units-${index}`] = 'Enter null if not required';
      if (!param.resolution) newErrors[`resolution-${index}`] = 'Enter null if not required';
      // accuracy, units, resolution are optional, so don't check here
    });
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  
  
  // When the vertical changes, update the parameters
  const handleVerticalChange = (event) => {
    const {
      target: { value }
    } = event;
    // reload the page with the new verticalId
    navigate(`/datamodel?filter=${encodeURIComponent(value)}`);
    const selectedVerticalName = event.target.value;
    setSelectedVertical(selectedVerticalName);




  
    const vertical = verticals.find((v) => v.description === selectedVerticalName);
    if (vertical) {
      setParameters(vertical.parameters || []);
    } else {
      setParameters([]);
    }
  };
  


  const handleConfirmDialogOpen = () => {
    setOpenConfirmDialog(true);
  };

  const handleConfirmDialogClose = (isConfirmed) => {
    setOpenConfirmDialog(false);
  
    if (isConfirmed) {
      setIsModifyConfirmed(true);
  
      // Construct finalParameters with proper handling for 'NA' values
      const finalParameters = parameters.map((param) => ({
        name: param.name,
        pdescription: param.pdescription,
        accuracy: param.accuracy?.trim() === '' ? null : param.accuracy,
        units: param.units?.trim() === '' ? null : param.units,
        resolution: param.resolution?.trim() === '' ? null : param.resolution,
        data_type: param.data_type,
      }));
      
      
  
      // Find the selected vertical data
      const selectedVerticalData = verticals.find(
        (v) => v.name === selectedVertical
      );
  
      if (selectedVerticalData) {
        const { name, res_short_name, description, labels, id } = selectedVerticalData;
  
        // Prepare the data for API call
        const requestData = {
          res_name: name,
          res_short_name: res_short_name,
          description: description,
          labels: labels || [],  // Ensure labels are always an array
          name: finalParameters.map((param) => param.name),
          pdescription: finalParameters.map((param) => param.pdescription),
          data_types: finalParameters.map((param) => param.data_type),
          accuracy: finalParameters.map((param) => param.accuracy),
          units: finalParameters.map((param) => param.units),
          resolution: finalParameters.map((param) => param.resolution),
        };
  
        // Handle adding or updating parameters
        axiosAuthInstance
          .put(`/verticals/update-ae/${id}`, requestData)
          
          .then((response) => {
            console.log(requestData);
            console.log(response.data.detail);
            if (response.data && response.data.detail === 'AE updated successfully') {
              MySwal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Domain Modified successfully.',
                showConfirmButton: false,
                timer: 1500,  // Show success popup for 1.5 seconds
              }).then(() => {
                window.location.reload();  // Reload the page after the popup closes
              });
            }
          })
          .catch((error) => {
            console.error('Error in PUT request:', error);
            if (error.response && error.response.status === 409) {
              MySwal.fire({
                icon: 'warning',
                title: 'Domain already exists!',
              });
            } else {
              MySwal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.response ? error.response.data.detail : 'An unexpected error occurred.',
              });
            }
          });
      }
    } else {
      setIsModifyConfirmed(false);
    }
  };
  
  
  
  
  const toggleEditable = () => {
    if (editable) {
      // If already editable, validate fields before saving
      const isValid = validateFields();
      if (isValid) {
        // Save the changes when editing is done
        console.log('Toggled editable. Current parameters:', parameters);
        setEditable(false);  // Disable editing after confirmation
      }
    } else {
      // Allow editing only if Modify is confirmed
      setEditable(true);  // This will not be triggered now since fields are logged instead
    }
  };
  
  
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isModifyConfirmed) {
      handleConfirmDialogOpen();
    }
  };
  
  
  const handleParameterChange = (index, field, value) => {
    setParameters((prevParameters) =>
      prevParameters.map((param, i) =>
        i === index ? { ...param, [field]: value } : param
      )
    );
  
    // Clear the error when the user enters something
    if (value.trim() !== '') {
      const updatedErrors = { ...errors };
      delete updatedErrors[`${field}-${index}`];
      setErrors(updatedErrors);
    }
  };
  
  

  const handleRemoveParameter = (index) => {
    setParameters((prevParameters) => prevParameters.filter((_, i) => i !== index));
  };

  const handleAddParameter = () => {
    // Create a new parameter object with default values (or customize as needed)
    const newParameter = {
      name: '',
      pdescription: '',
      accuracy: '',
      units: '',
      resolution: '',
      data_type: '',
      isNew: true,
    };
    
  
    // Add the new parameter to the existing parameters array
    setParameters((prevParams) => [...prevParams, newParameter]);
  };

  return (
    <Box sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>
              <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
                <ArrowBackIcon />
              </IconButton>
              </Box>
      <Typography variant="h4">{selectedVertical} - Data Model</Typography>

      {/* <FormControl fullWidth margin="normal">
  <InputLabel id="select-vertical-label">Select Domain</InputLabel>
  <Select
    labelId="select-vertical-label"
    value={selectedVertical}
    label="Select Vertical"
    onChange={handleVerticalChange}
    disabled={verticals.length === 0} // Disable dropdown if no verticals
  >
    {verticals.length > 0 ? (
      verticals.map((vertical) => (
        <MenuItem key={vertical.id} value={vertical.name}>
          {vertical.name}
        </MenuItem>
      ))
    ) : (
      <MenuItem value="" disabled>No verticals available</MenuItem>
    )}
  </Select>
</FormControl> */}


{/* Display additional details for the selected vertical */}
{selectedVertical && (
  <Box mt={2} p={2} border={1} borderColor="grey.300" borderRadius={4}>
    {(() => {
      const selected = verticals.find((vertical) => vertical.name === selectedVertical);
      return selected ? (
        <div>
          {/* <Typography><strong>Short Name:</strong> {selected.res_short_name}</Typography> */}
          <Typography><strong>Description:</strong> {selected.description}</Typography>
          {/* <Typography><strong>Labels:</strong> {selected.labels.join(', ')}</Typography> */}
        </div>
      ) : (
        <Typography>No details available.</Typography>
      );
    })()}
  </Box>
)}


      {parameters.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Parameters</Typography>
          {parameters.map((param, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField
              label="Name"
              variant="outlined"
              value={param.name}
              disabled={!editable}
              onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
              error={Boolean(errors[`name-${index}`])}
              helperText={errors[`name-${index}`] && errors[`name-${index}`]}
              sx={{ mr: 1, flex: 1 }}
            />
            <TextField
              label="Parameter Description"
              variant="outlined"
              value={param.pdescription }  // Show "NA" if empty
              disabled={!editable}
              onChange={(e) => handleParameterChange(index, 'pdescription', e.target.value)}
              error={Boolean(errors[`pdescription-${index}`]) }
              helperText={errors[`pdescription-${index}`] && errors[`pdescription-${index}`]}
              sx={{ mr: 1, flex: 1 }}
            />
            <TextField
              label="Accuracy"
              variant="outlined"
              value={param.accuracy }  // Show "NA" if empty
              disabled={!editable}
              onChange={(e) => handleParameterChange(index, 'accuracy', e.target.value)}
              error={Boolean(errors[`accuracy-${index}`]) }
              helperText={errors[`accuracy-${index}`] && errors[`accuracy-${index}`]}
              sx={{ mr: 1, flex: 1 }}
            />

            <TextField
              label="Units"
              variant="outlined"
              value={param.units}  // Show "NA" if empty
              disabled={!editable}
              onChange={(e) => handleParameterChange(index, 'units', e.target.value)}
              error={Boolean(errors[`units-${index}`]) }
              helperText={errors[`units-${index}`]   && errors[`units-${index}`]}
              sx={{ mr: 1, flex: 1 }}
            />

            <TextField
              label="Resolution"
              variant="outlined"
              value={param.resolution }  // Show "NA" if empty
              disabled={!editable}
              onChange={(e) => handleParameterChange(index, 'resolution', e.target.value)}
              error={Boolean(errors[`resolution-${index}`]) }
              helperText={errors[`resolution-${index}`]  && errors[`resolution-${index}`]}
              sx={{ mr: 1, flex: 1 }}
            />
<FormControl variant="outlined" sx={{ mr: 1, flex: 1 }}>
  <InputLabel>Data Type</InputLabel>
  <Select
    value={param.data_type || param.data_type || ""} // Show updated value or fallback
    disabled={!editable}
    onChange={(e) => {
      const newValue = e.target.value;
      handleParameterChange(index, 'data_type', newValue); // Update data_type
    }}
    label="Data Type"
    error={Boolean(errors[`data_type-${index}`])} // Highlight input if there's an error
  >
    <MenuItem value="int">Number</MenuItem>
    <MenuItem value="string">Text</MenuItem>
    <MenuItem value="float">Decimal</MenuItem>
  </Select>
  {errors[`data_type-${index}`] && (
    <Typography variant="body2" color="error">
      {errors[`data_type-${index}`]}
    </Typography>
  )}
</FormControl>
    {editable && (
      <IconButton
        aria-label="delete"
        onClick={() => handleRemoveParameter(index)}
      >
        <DeleteIcon />
      </IconButton>
    )}
{/* {param.isNew && ( */}
          {/* <IconButton onClick={() => handleRemoveParameter(index)}>
            <DeleteIcon />
          </IconButton> */}
        {/* )} */}
            </Box>
          ))}
                        {editable && (
                          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
  <span onClick={handleAddParameter} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
    <ControlPointIcon />
    <span style={{ marginLeft: 8 }}>Add Parameter</span>
  </span>
</Box>

        )}
                    <Button
  variant="contained"
  color="primary"
  onClick={toggleEditable}
  sx={{ mb: 2, m:2 }}
  startIcon={editable ? <TurnedInIcon /> : <CreateIcon />}
>
  {editable ? 'Save' : 'Edit'}
</Button>
        </Box>
      )}

      <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ mt: 3 }}>
        Modify domain
      </Button>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to modify the domain? This action will make the parameters editable.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmDialogClose(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => handleConfirmDialogClose(true)} color="secondary">
            Yes, Modify
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default DataModel;
