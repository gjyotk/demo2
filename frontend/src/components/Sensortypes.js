import React, { useContext, useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import IconButton from '@mui/material/IconButton';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Stack,
  Grid,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Fab, Radio, RadioGroup, FormLabel,
  FormGroup, FormControlLabel, Checkbox, Divider,
  Select,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
// import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import SweetAlert from 'sweetalert2';
import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'black' : '#fff',
  padding: theme.spacing(2),
  textAlign: 'left',
  color: 'black',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  }
}));

export default function Details() {
  const { verticals, fetchAllVerticals, fetchedVerticals, fetchUser, user } = useContext(DataContext);
  const [selectedData, setSelectedData] = useState({ id: '', name: '' });
  const [sensorTypes, setSensorTypes] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null); // State for the expanded card
  const location = useLocation();
  const navigate = useNavigate();

  const [assignedFilter, setAssignedFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [availableEmails, setAvailableEmails] = useState([]);
  const [userVerticalsData, setUserVerticalsData] = useState([]);// State to store users and their verticals

  const fetchSensorTypes = async (verticalId = '', verticalName = '') => {
    const endpoint =
      verticalId === 'all' || verticalId === ''
        ? '/sensor-types/sensor-types-all'
        : `/sensor-types/sensor-types-all?vertical_id=${verticalId}`;

    try {
      const response = await axiosAuthInstance.get(endpoint);
      const sensorData = response.data;
      setSensorTypes(sensorData);

      // Update available roles and emails based on the new sensor data
      const vendors = sensorData.flatMap(sensor => sensor.assigned_vendor || []);
      const roles = [...new Set(vendors.map(v => v.assigned_vendor_role))].filter(Boolean);
      const emails = [...new Set(vendors.map(v => v.assigned_vendor_name))].filter(Boolean);

      setAvailableRoles(roles);
      setAvailableEmails(emails);

      // Rest of the function remains the same
      setSelectedData({ id: verticalId, name: verticalName || verticalId });
      const params = new URLSearchParams(location.search);
      params.set('filter', verticalName || 'all');
      navigate(`/sensortypes?${params.toString()}`);
    } catch (err) {
      setSensorTypes([]); // Clear sensor types on error

      // Update selected data to reflect the domain, even on error (404)
      setSelectedData({ id: verticalId, name: verticalName || verticalId });

      if (err.response?.status === 404) {
        SweetAlert.fire({
          icon: 'info',
          title: 'No Sensor Types',
          text: 'No sensor types available for the selected domain.',
          timer: 2000,
          toast: true,
          position: 'center-end',
          showConfirmButton: false,
        });
      } else {
        SweetAlert.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error fetching sensor types',
          timer: 1500,
          toast: true,
          position: 'center-end',
          showConfirmButton: false,
        });
      }

      console.error('Error fetching sensor types:', err);
    }
  };



  useEffect(() => {
    if (!fetchedVerticals) fetchAllVerticals();
    fetchUser();

    const params = new URLSearchParams(location.search);
    const filter = params.get('filter') || 'all';
    const vertical = verticals.find((v) => v.name === filter) || {};

    setSelectedData({ id: vertical.id || '', name: vertical.name || filter });
    fetchSensorTypes(vertical.id || '', vertical.name || filter);
  }, []);

  const handleVerticalChange = async (event) => {
    const { value } = event.target;
    const vertical = verticals.find((v) => v.id === value) || {};

    // Clear selections first
    setSelectedRoles([]);
    setSelectedEmails([]);
    setAssignedFilter('all');

    // Fetch sensor types for new domain
    await fetchSensorTypes(value, vertical.name);
  };

  const handleRoleChange = (role, checked) => {
    setSelectedRoles((prevSelectedRoles) => {
      const newRoles = checked
        ? [...prevSelectedRoles, role]
        : prevSelectedRoles.filter((r) => r !== role);

      const updatedEmails = userVerticalsData
        .flatMap((v) => v.assigned_vendor || [])
        .filter((vendor) => newRoles.includes(vendor.assigned_vendor_role))
        .map((v) => v.assigned_vendor_name);


      setSelectedEmails([...new Set(updatedEmails)]);

      const hasAssigned = sensorTypes.some(
        (v) =>
          v.assigned &&
          v.assigned_vendor.some((vendor) =>
            newRoles.includes(vendor.assigned_vendor_role)
          )
      );
      setAssignedFilter(hasAssigned ? 'assigned' : 'all');

      return newRoles;
    });
  };

  const handleEmailChange = (email, checked) => {
    setSelectedEmails((prevSelectedEmails) => {
      const newEmails = checked
        ? [...prevSelectedEmails, email]
        : prevSelectedEmails.filter((e) => e !== email);

      const updatedRoles = verticals
        .flatMap((v) => v.assigned_vendor)
        .filter((vendor) => newEmails.includes(vendor.assigned_vendor_name))
        .map((v) => v.assigned_vendor_role);

      setSelectedRoles([...new Set(updatedRoles)]);

      const hasAssigned = sensorTypes.some(
        (v) =>
          v.assigned &&
          v.assigned_vendor.some((vendor) =>
            newEmails.includes(vendor.assigned_vendor_name)
          )
      );
      setAssignedFilter(hasAssigned ? 'assigned' : 'all');

      return newEmails;
    });
  };

  const handleAssignedFilterChange = (value) => {
    setAssignedFilter(value);

    // Clear role and email selections when switching to 'all' or 'unassigned'
    if (value === 'all' || value === 'unassigned') {
      setSelectedRoles([]);
      setSelectedEmails([]);
    }

    // Only set roles and emails when explicitly selecting 'assigned'
    if (value === 'assigned') {
      const assignedSensors = sensorTypes.filter(sensor => 
        (sensor.assigned_vendor || []).length > 0
      );

      if (assignedSensors.length > 0) {
        const allVendors = assignedSensors.flatMap(sensor => sensor.assigned_vendor || []);
        const roles = [...new Set(allVendors.map(v => v.assigned_vendor_role))];
        const emails = [...new Set(allVendors.map(v => v.assigned_vendor_name))];

        setSelectedRoles(roles);
        setSelectedEmails(emails);
      }
    }
  };

  const filteredVerticals = sensorTypes.filter((sensor) => {
    const assignedVendors = sensor.assigned_vendor || [];
    const isAssigned = assignedVendors.length > 0;

    const roleMatch =
      selectedRoles.length === 0 ||
      assignedVendors.some((v) => selectedRoles.includes(v.assigned_vendor_role));

    const emailMatch =
      selectedEmails.length === 0 ||
      assignedVendors.some((v) => selectedEmails.includes(v.assigned_vendor_name));

    const assignedMatch =
      assignedFilter === 'all' ||
      (assignedFilter === 'assigned' && isAssigned) ||
      (assignedFilter === 'unassigned' && !isAssigned);

    return roleMatch && emailMatch && assignedMatch;
  });




  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosAuthInstance.get('/sensor-types/sensor-types-all');
        const usersList = response.data || [];
        setUserVerticalsData(usersList); // <-- store users and their verticals



        const allVendors = usersList.flatMap(userData => userData.assigned_vendor || []);
        const emails = [...new Set(allVendors.map(vendor => vendor.assigned_vendor_name))];
        const roles = [...new Set(allVendors.map(vendor => vendor.assigned_vendor_role))];

        setAvailableEmails(emails);
        setAvailableRoles(roles);

      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  console.log('Filtered Vertical Count:', filteredVerticals.length);


  const handleExpandCard = (sensorType) => {
    setExpandedCard(sensorType);
  };

  const handleCloseCard = () => {
    setExpandedCard(null);
  };

  const handleDeleteItem = (itemId, verticalId) => {
    console.log("Deleting ID:", itemId);
    console.log("Deleting Vertical ID:", verticalId);

    axiosAuthInstance
      .delete(`/sensor-types/delete`, {
        data: {
          id: itemId,
          vertical_id: verticalId,
        },
      })
      .then((response) => {
        console.log("Response:", response);
        if (response.status === 200 || response.status === 204) {
          SweetAlert.fire({
            icon: "success",
            title: "Sensor Type Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error("Error:", error.response?.data || error.message);

        // Check if error status is 400 and show appropriate message
        if (error.response?.status === 400) {
          SweetAlert.fire({
            icon: "error",
            title: "Error",
            text: "Sensor type is associated with nodes and cannot be deleted.",
            showConfirmButton: false,
            timer: 1200,
            toast: true,
            position: "center-end",
          });
        }
      });
  };


  const handleDeleteClick = (itemId, verticalId) => {
    SweetAlert.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this sensor type?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteItem(itemId, verticalId);
      }
    });
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      overflowX: 'hidden'
    }}>
      <Box sx={{ mb: { xs: 1, sm: 2 } }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black', p: { xs: 0.5, sm: 1 } }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <FormControl sx={{ m: { xs: 0.5, sm: 1 }, width: '100%' }}>
        <InputLabel id="select-domain-label">Select Domain</InputLabel>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Select
            labelId="select-domain-label"
            id="select-domain"
            value={selectedData.id || 'all'}
            onChange={handleVerticalChange}
            label="Select Domain"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200, // set your desired max height here
                },
              },
            }}
            sx={{ flex: 1 }} // Allow Select to take up available space
          >
            <MenuItem value="all">All</MenuItem>
            {verticals.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>

        </Box>
      </FormControl>{/* Row to align TextField and IconButton side by side */}


      <Box
  sx={{
    height: 'auto', // allow the container to adjust
    position: 'sticky',
    background: '#fff',
    top: 0,
    zIndex: 10,
    flexDirection: { xs: 'column', md: 'row' },
    '& .MuiTypography-subtitle1': {
      fontSize: { xs: '0.9rem', sm: '1rem' }
    },
    '& .MuiFormControlLabel-label': {
      fontSize: { xs: '0.8rem', sm: '0.9rem' }
    }
  }}
>
  <Box
    sx={{
      p: { xs: 1, sm: 2 },
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2
    }}
  >
    {/* Roles Filter */}
    <Box sx={{ 
      flex: 1,
      minWidth: { xs: '100%', md: '30%' }
    }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Roles
      </Typography>
      <Box sx={{ maxHeight: '200px', overflowY: 'auto', p: 1 }}>
        <FormGroup>
          {availableRoles.map((role) => (
            <FormControlLabel
              key={role}
              control={
                <Checkbox
                  checked={selectedRoles.includes(role)}
                  onChange={(e) => handleRoleChange(role, e.target.checked)}
                />
              }
              label={role}
            />
          ))}
        </FormGroup>
      </Box>
    </Box>

    {/* Divider */}
    <Divider
      orientation="vertical"
      flexItem
      sx={{
        display: { xs: 'none', md: 'block' },
        borderWidth: 3,
        backgroundColor: 'gray',
        mx: 2
      }}
    />

    {/* Emails Filter */}
    <Box sx={{ 
      flex: 1,
      minWidth: { xs: '100%', md: '30%' }
    }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Emails
      </Typography>
      <Box sx={{ maxHeight: '200px', overflowY: 'auto', p: 1 }}>
        <FormGroup>
          {availableEmails.map((email) => (
            <FormControlLabel
              key={email}
              control={
                <Checkbox
                  checked={selectedEmails.includes(email)}
                  onChange={(e) => handleEmailChange(email, e.target.checked)}
                />
              }
              label={email}
            />
          ))}
        </FormGroup>
      </Box>
    </Box>

    {/* Divider */}
    <Divider
      orientation="vertical"
      flexItem
      sx={{
        display: { xs: 'none', md: 'block' },
        borderWidth: 3,
        backgroundColor: 'gray',
        mx: 2
      }}
    />

    {/* Assigned Filter */}
    <Box sx={{ 
      flex: 1,
      minWidth: { xs: '100%', md: '30%' }
    }}>
      <FormControl component="fieldset">
        <FormLabel component="legend">Assigned Filter</FormLabel>
        <RadioGroup
          value={assignedFilter}
          onChange={(e) => handleAssignedFilterChange(e.target.value)}
        >
          <FormControlLabel value="all" control={<Radio />} label="All" />
          <FormControlLabel value="assigned" control={<Radio />} label="Assigned" />
          <FormControlLabel value="unassigned" control={<Radio />} label="Unassigned" />
        </RadioGroup>
      </FormControl>
    </Box>
  </Box>
</Box>




      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: { xs: 1, sm: 2 } }}>
        <Grid item xs={12}>
          <Stack spacing={{ xs: 1, sm: 2, md: 3 }}>
            {sensorTypes.length > 0 && verticals.length > 0 ? (
              filteredVerticals
                .filter((item) => {
                  // Handle the case when no filters are selected
                  if (selectedRoles.length === 0 && selectedEmails.length === 0) {
                    return true;
                  }

                  // Check if the sensor type has any assigned vendors
                  const assignedVendors = item.assigned_vendor || [];

                  // Check if any assigned vendor matches the selected roles and emails
                  return assignedVendors.some(vendor =>
                    (selectedRoles.length === 0 || selectedRoles.includes(vendor.assigned_vendor_role)) &&
                    (selectedEmails.length === 0 || selectedEmails.includes(vendor.assigned_vendor_name))
                  );
                })
                .map((sensorType) => (
                  <StyledPaper
                    key={sensorType.id}
                    sx={{
                      transition: 'all 0.3s ease-in-out',
                      ...(expandedCard?.id === sensorType.id && { backgroundColor: '#f5f5f5' }),
                      '& .MuiTypography-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      },
                      '& .MuiButton-root': {
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span>
                          <strong>Domain:</strong>{' '}
                          {verticals.find((v) => v.id === sensorType.vertical_id)?.name || 'Unknown Vertical'}
                        </span>
                        <span>
                          <strong>Sensor Type:</strong> {sensorType.res_name}
                        </span>
                      </Typography>
                      <Box>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleExpandCard(sensorType)}>
                          View Details
                        </Button>

                        {user?.user_type === 1 && (
                          <>
                            {/* Delete Button */}
                            <IconButton
                              onClick={() => handleDeleteClick(sensorType.id, sensorType.vertical_id)}
                              aria-label="delete"
                            >
                              <DeleteIcon />
                            </IconButton>

                            {/* Assign Vendor Button */}
                            <IconButton
                              style={{ cursor: 'pointer' }}
                              aria-label="assign vendor"
                              onClick={async () => {
                                try {
                                  const response = await axiosAuthInstance.get('/user/getusers');
                                  const allUsers = response.data;

                                  let vendorUsers = [];
                                  if (user?.user_type === 1) {
                                    vendorUsers = allUsers?.filter((u) =>
                                      (u.user_type === 1 || u.user_type === 2 || u.user_type === 3) && u.status === 'accepted'
                                    ) || [];
                                  } else if (user?.user_type === 2) {
                                    vendorUsers = allUsers?.filter((u) =>
                                      u.user_type === 3 && u.status === 'accepted'
                                    ) || [];
                                  }

                                  const generateOptions = (users) =>
                                    users.map(u => `<option value="${u.email}">${u.name}</option>`).join('');

                                  SweetAlert.fire({
                                    title: 'Assign Vendor',
                                    html: `
                                  <style>
                                    #vendor-search {
                                      width: 90%;
                                      padding: 6px;
                                      margin-bottom: 10px;
                                      font-size: 16px;
                                      border: 1px solid #ccc;
                                      border-radius: 4px;
                                    }
                              
                                    select.swal2-select {
                                      max-height: 200px;
                                      width: 90%;
                                      overflow-y: auto;
                                    }
                              
                                    select.swal2-select option {
                                      border-bottom: 1px solid #ccc;
                                      padding: 8px;
                                    }
                              
                                    select.swal2-select option:hover {
                                      background-color: rgb(175, 178, 184);
                                    }
                                  </style>
                              
                                  <div style="display: flex; flex-direction: column; align-items: center">
                                    <input id="vendor-search" placeholder="Search email..." />
                                    <select id="vendor-type" class="swal2-select" size="5" style="
                                      margin-bottom: 10px;
                                      font-size: 18px;
                                      cursor: pointer;
                                    ">
                                      ${generateOptions(vendorUsers)}
                                    </select>
                                  </div>
                                `,
                                    showCancelButton: true,
                                    confirmButtonText: 'Assign',
                                    cancelButtonText: 'Cancel',

                                    didOpen: () => {
                                      const vendorSearch = document.getElementById('vendor-search');
                                      const vendorSelect = document.getElementById('vendor-type');

                                      vendorSearch.addEventListener('input', () => {
                                        const searchText = vendorSearch.value.toLowerCase();
                                        const filtered = vendorUsers
                                          .filter(u => u.email.toLowerCase().includes(searchText));
                                        vendorSelect.innerHTML = generateOptions(filtered);
                                      });
                                    },

                                    preConfirm: () => {
                                      const vendorType = document.getElementById('vendor-type').value;
                                      if (!vendorType) {
                                        SweetAlert.showValidationMessage('Please select a vendor');
                                        return false;
                                      }
                                      return { vendorType, email: vendorType };
                                    }
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      const payload = {
                                        sensortype_id: sensorType.id,
                                        vendor_email: result.value.email
                                      };

                                      console.log('Sending payload:', payload);

                                      axiosAuthInstance.post('/sensor-types/assign-vendor', payload, {
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Accept': 'application/json'
                                        }
                                      })
                                        .then(() => {
                                          SweetAlert.fire({
                                            icon: 'success',
                                            title: 'Vendor Assigned',
                                            text: `Successfully assigned to ${result.value.email}`,
                                            showConfirmButton: false,
                                            timer: 1500
                                          });
                                        })
                                        .catch((error) => {
                                          SweetAlert.fire({
                                            icon: 'error',
                                            title: 'Assignment Failed',
                                            text: error.response?.data?.detail || 'An error occurred while assigning vendor',
                                            showConfirmButton: true
                                          });
                                        });
                                    }
                                  });

                                } catch (error) {
                                  SweetAlert.fire({
                                    icon: 'error',
                                    title: 'Error Fetching Users',
                                    text: error?.response?.data?.detail || 'Could not fetch users',
                                    showConfirmButton: true,
                                  });
                                }
                              }}
                            >
                              <PersonAddAltIcon />
                            </IconButton>

                          </>
                        )}


                        {user?.user_type === 2 && (
                          <>
                            {/* Assign Vendor Button */}
                            <IconButton
                              style={{ cursor: 'pointer' }}
                              aria-label="assign vendor"
                              onClick={async () => {
                                try {
                                  const response = await axiosAuthInstance.get('/user/getusers');
                                  const allUsers = response.data;

                                  let vendorUsers = [];
                                  if (user?.user_type === 1) {
                                    vendorUsers = allUsers?.filter((u) =>
                                      (u.user_type === 1 || u.user_type === 2 || u.user_type === 3) && u.status === 'accepted'
                                    ) || [];
                                  } else if (user?.user_type === 2) {
                                    vendorUsers = allUsers?.filter((u) =>
                                      u.user_type === 3 && u.status === 'accepted'
                                    ) || [];
                                  }

                                  const generateOptions = (users) =>
                                    users.map(u => `<option value="${u.email}">${u.email}</option>`).join('');

                                  SweetAlert.fire({
                                    title: 'Assign Vendor',
                                    html: `
        <style>
          #vendor-search {
            width: 90%;
            padding: 6px;
            margin-bottom: 10px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
    
          select.swal2-select {
            max-height: 200px;
            width: 90%;
            overflow-y: auto;
          }
    
          select.swal2-select option {
            border-bottom: 1px solid #ccc;
            padding: 8px;
          }
    
          select.swal2-select option:hover {
            background-color: rgb(175, 178, 184);
          }
        </style>
    
        <div style="display: flex; flex-direction: column; align-items: center">
          <input id="vendor-search" placeholder="Search email..." />
          <select id="vendor-type" class="swal2-select" size="5" style="
            margin-bottom: 10px;
            font-size: 18px;
            cursor: pointer;
          ">
            ${generateOptions(vendorUsers)}
          </select>
        </div>
      `,
                                    showCancelButton: true,
                                    confirmButtonText: 'Assign',
                                    cancelButtonText: 'Cancel',

                                    didOpen: () => {
                                      const vendorSearch = document.getElementById('vendor-search');
                                      const vendorSelect = document.getElementById('vendor-type');

                                      vendorSearch.addEventListener('input', () => {
                                        const searchText = vendorSearch.value.toLowerCase();
                                        const filtered = vendorUsers
                                          .filter(u => u.email.toLowerCase().includes(searchText));
                                        vendorSelect.innerHTML = generateOptions(filtered);
                                      });
                                    },

                                    preConfirm: () => {
                                      const vendorType = document.getElementById('vendor-type').value;
                                      if (!vendorType) {
                                        SweetAlert.showValidationMessage('Please select a vendor');
                                        return false;
                                      }
                                      return { vendorType, email: vendorType };
                                    }
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      const payload = {
                                        sensortype_id: sensorType.id,
                                        vendor_email: result.value.email
                                      };

                                      console.log('Sending payload:', payload);

                                      axiosAuthInstance.post('/sensor-types/assign-vendor', payload)
                                        .then(() => {
                                          SweetAlert.fire({
                                            icon: 'success',
                                            title: 'Vendor Assigned',
                                            text: `Successfully assigned to ${result.value.email}`,
                                            showConfirmButton: false,
                                            timer: 1500
                                          });
                                        })
                                        .catch((error) => {
                                          SweetAlert.fire({
                                            icon: 'error',
                                            title: 'Assignment Failed',
                                            text: error.response?.data?.detail || 'An unexpected error occurred',
                                            showConfirmButton: true
                                          });
                                        });

                                    }
                                  });

                                } catch (error) {
                                  SweetAlert.fire({
                                    icon: 'error',
                                    title: 'Error Fetching Users',
                                    text: error?.response?.data?.detail || 'Could not fetch users',
                                    showConfirmButton: true,
                                  });
                                }
                              }}
                            >
                              <PersonAddAltIcon />
                            </IconButton>

                          </>
                        )}
                      </Box>
                    </Box>
                    {expandedCard && expandedCard.id === sensorType.id && (
                      <Box sx={{ mt: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h5" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            <strong>Sensor Type Details</strong>
                          </Typography>
                          <IconButton onClick={handleCloseCard}>
                            <CloseIcon />
                          </IconButton>
                        </Box>

                        <Box sx={{ mt: 2, overflowX: 'auto' }}>
                          <TableContainer 
                            component={Paper} 
                            sx={{ 
                              maxHeight: { xs: 200, sm: 250 },
                              '& .MuiTable-root': {
                                width: '100%',
                                '@media (max-width: 600px)': {
                                  minWidth: 'unset',
                                  '& td, & th': {
                                    minWidth: 'unset',
                                    width: 'auto'
                                  }
                                }
                              },
                              '& .MuiTableCell-root': {
                                padding: { xs: '4px', sm: '6px' },
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: { xs: '60px', sm: '100px' }
                              }
                            }}
                          >
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Parameter</TableCell>
                                  <TableCell>Accuracy</TableCell>
                                  <TableCell>Unit</TableCell>
                                  <TableCell>Resolution</TableCell>
                                  <TableCell>Data Type</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {expandedCard.parameters.map((param, idx) => (
                                  <TableRow key={param}>
                                    <TableCell component="th" scope="row">{param}</TableCell>
                                    <TableCell>{expandedCard.accuracy[idx]}</TableCell>
                                    <TableCell>{expandedCard.units[idx]}</TableCell>
                                    <TableCell>{expandedCard.resolution[idx]}</TableCell>
                                    <TableCell>{expandedCard.data_types[idx]}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Box>
                    )}
                  </StyledPaper>

                ))
            ) : (
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                Sensor Types are not available
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>
      {user?.user_type !== 3 && (
        <Fab
          color="primary"
          aria-label="add"
          size="medium"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
          onClick={() => navigate(`/add?step=2`)}
        >
          <Typography variant="button">ADD</Typography>
        </Fab>
      )}



    </Box>
  );
}
