import { useContext, useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';

const MySwal = withReactContent(Swal);

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

export default function MultipleSelect() {
  const { verticals } = useContext(DataContext);

  const [selectedData, setSelectedData] = useState(null);
  const [selectedDataError, setSelectedDataError] = useState(false);
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [protocol, setprotocol] = useState('');
  const [latitude, setlatitude] = useState('');
  const [longitude, setlongitude] = useState('');
  const [nameError, setNameError] = useState(false);
  const [areaError, setAreaError] = useState(false);
  const [latitudeError, setlatitudeError] = useState(false);
  const [longitudeError, setlongitudeError] = useState(false);
  const [protocolError, setprotocolError] = useState(false);
  const [sensorTypes, setSensorTypes] = useState([]);
  const [selectedSensorType, setSelectedSensorType] = useState('');
  const navigate = useNavigate();
  const location = useLocation();


  const handleChange = (event) => {
    const {
      target: { value }
    } = event;
    const selectedItem = verticals.find((item) => item.id === value);
    setSelectedData(selectedItem);
    setSelectedDataError(false);

    axiosAuthInstance
      .get(`/sensor-types/get/${value}`)
      .then((response) => {
        setSensorTypes(response.data);
        // console.log(response.data);
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error fetching sensor types',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
          position: 'center-end'
        });
        console.error('Error fetching stats:', err);
      });
  };

  const handleAddNodeType = () => {
    if (!selectedData) {
      setSelectedDataError(true);
    } else {
      setSelectedDataError(false);
    }

    if(!name) {
      setNameError(true);
    }else {
      setNameError(false);
    }
    if (!area) {
      setAreaError(true);
    } else {
      setAreaError(false);
    }
    if (!protocol) {
      setprotocolError(true);
    } else {
      setprotocolError(false);
    }
    if (!latitude) {
      setlatitudeError(true);
    } else {
      setlatitudeError(false);
    }

    if (!longitude) {
      setlongitudeError(true);
    } else {
      setlongitudeError(false);
    }



    if (!selectedData || !latitude || !longitude || !area || !name || !protocol) {
      return; 
    }

    // Log selected vertical, node type, and added parameters to the console
    // console.log('Selected Domain:', selectedData);
    // console.log('Sensor Type:', document.getElementById('text-field').value);
    // console.log('latitude:', latitude);
    // console.log('longitude:', longitude);
    // console.log('area:', area);
    // console.log('name:', name);
    //     "sensor_type_id": 1,
    // "latitude": 17.446920,
    // "longitude": 78.348122,
    // "area": "Miyapur"
    // "name" : "unique name"
    axiosAuthInstance
      .post('nodes/create-node', {
        sensor_type_id: sensorTypes.find((type) => type.res_name === selectedSensorType).id,
        latitude,
        longitude,
        area,
        name,
        protocol
      })
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          MySwal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Node added successfully.',
            showConfirmButton: false,
            timer: 1500 // Auto close after 1.5 seconds
          });
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
        MySwal.fire({
          icon: 'error',
          title: 'Oops...',
          text: `${error.message}`,
          footer: `<p>${error?.response?.data?.detail}</p>`
        });
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
      <div>
        <Typography noWrap sx={{ fontSize: '1.5rem' }}>
          <div>
            <strong>Add New Node</strong> <br />
          </div>
        </Typography>

        <FormControl sx={{ m: 1, display: 'flex', width: '100%' }}>
          <InputLabel
            id="demo-multiple-name-label"
            sx={{ marginRight: 1, marginBottom: 1 }} // Added marginBottom to Add space
          >
            Select Domain
          </InputLabel>
          <Select
            labelId="demo-multiple-name-label"
            id="demo-multiple-name"
            multiple={false}
            value={selectedData ? selectedData.id : ''}
            onChange={handleChange}
            MenuProps={MenuProps}
            sx={{ flex: 1 }}
            label="Select Domain" // Added label prop to ensure space for label
            error={selectedDataError} // Add error prop based on selectedDataError
          >
            {verticals.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>

          {selectedDataError && (
            <Typography variant="caption" color="error">
              Domain type is required
            </Typography>
          )}
        </FormControl>

        <FormControl sx={{ m: 1, display: 'flex', width: '100%' }}>
          <InputLabel
            id="demo-multiple-name-label"
            sx={{ marginRight: 1, marginBottom: 1 }} // Added marginBottom to Add space
          >
            Select Sensor Type
          </InputLabel>
          <Select
            labelId="demo-multiple-name-label"
            id="demo-multiple-name"
            multiple={false}
            value={selectedSensorType}
            onChange={(e) => setSelectedSensorType(e.target.value)}
            MenuProps={MenuProps}
            sx={{ flex: 1 }}
            label="Select Sensor Type"
            error={selectedDataError}>
            <MenuItem value="None">None</MenuItem>
            {sensorTypes &&
              sensorTypes.length > 0 &&
              sensorTypes.map((node) => (
                <MenuItem key={node.res_name} value={node.res_name}>
                  {node.res_name}
                </MenuItem>
              ))}
          </Select>

          {selectedDataError && (
            <Typography variant="caption" color="error">
              Sensor type is required
            </Typography>
          )}
          <Typography variant="caption" color="true">
            Select Domain to enable menu options
          </Typography>
        </FormControl>
        {/* Field for Name */}
        <TextField
          id="text-field"
          error={nameError}
          helperText={nameError ? 'Name is required' : ''}
          label="Name"
          variant="outlined"
          fullWidth
          sx={{ m: 1 }}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false); // Reset error on change
          }}
        />
        {/* Field for Area */}
        <TextField
          id="text-field"
          error={areaError}
          helperText={areaError ? 'Area is required' : ''}
          label="Area"
          variant="outlined"
          fullWidth
          sx={{ m: 1 }}
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setAreaError(false); // Reset error on change
          }}
        />
          <TextField
          id="text-field"
          error={protocolError}
          helperText={protocolError ? 'Protocol is required' : ''}
          label="Protocol"
          variant="outlined"
          fullWidth
          sx={{ m: 1 }}
          value={protocol}
          onChange={(e) => {
            setprotocol(e.target.value);
            setprotocolError(false); // Reset error on change
          }}
         />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <TextField
            id="text-field"
            label="Latitude"
            variant="outlined"
            fullWidth
            sx={{ m: 1, flex: '1 0 calc(50% - 16px)' }} // Adjust the width to less than 50% to account for margins
            value={latitude}
            onChange={(e) => {
              setlatitude(e.target.value);
              setlatitudeError(false); // Reset error on change
            }}
            error={latitudeError}
            helperText={latitudeError ? 'Latitude is required' : ''}
          />

          <TextField
            id="text-field"
            label="Longitude"
            variant="outlined"
            fullWidth
            sx={{ m: 1, flex: '1 0 calc(50% - 16px)' }} // Adjust the width to less than 50% to account for margins
            value={longitude}
            onChange={(e) => {
              setlongitude(e.target.value);
              setlongitudeError(false); // Reset error on change
            }}
            error={longitudeError}
            helperText={longitudeError ? 'Longitude is required' : ''}
          />
        
        </Box>
    
      </div>
    

      {/* Submit button */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleAddNodeType}
        sx={{ mt: 2, m: 1 }}>
        Add Node
      </Button>
    </Box>
  );
}