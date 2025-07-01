// React imports
import { useContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Material UI imports
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import IconButton from '@mui/material/IconButton';
import {
  Box,
  Button,
  Paper,
  Stack,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Fab,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Radio,
  RadioGroup
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';

// Other third-party imports
import SweetAlert from 'sweetalert2';

// Local imports
import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';

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

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'black' : '#fff',
  padding: theme.spacing(2),
  textAlign: 'left',
  color: 'black',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
  '& .MuiTypography-h6': {
    fontSize: {
      xs: '0.9rem',
      sm: '1.1rem',
      md: '1.25rem'
    }
  },
  '& .MuiTypography-body1': {
    fontSize: {
      xs: '0.8rem',
      sm: '0.9rem',
      md: '1rem'
    }
  }
}));

function CheckboxFilter({ title, options, selectedOptions, onChange }) {
  // Special handling for nodeAssignment
  if (title.toLowerCase() === 'nodeassignment') {
    return (
      <div>
        <Typography variant="subtitle1">
          <strong>{title}</strong>
        </Typography>
        <RadioGroup
          value={selectedOptions.length ? selectedOptions[0] : 'all'}
          onChange={(e) => onChange(e.target.value, true)}
        >
          <FormControlLabel value="all" control={<Radio />} label="All" />
          <FormControlLabel value="assigned" control={<Radio />} label="Assigned" />
          <FormControlLabel value="unassigned" control={<Radio />} label="Unassigned" />
        </RadioGroup>
      </div>
    );
  }

  return (
    <div>
      <Typography variant="subtitle1">
        <strong>{title}</strong>
      </Typography>
      <Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {options.length === 0 && <Typography variant="body2">Not available</Typography>}
        {options.length > 0 &&
          options.map((option) => (
            <FormControlLabel
              key={option.value}
              style={{ display: 'block' }}
              control={
                <Checkbox
                  checked={selectedOptions.includes(option.value)}
                  onChange={(e) => onChange(option.value, e.target.checked)}
                  name={option.value}
                />
              }
              label={option.label}
            />
          ))}
      </Box>
    </div>
  );
}

export default function Details() {
  const { verticals, fetchAllVerticals, fetchedVerticals, fetchUser, user } = useContext(DataContext);

  // Uncommented usage
  const [selectedData, setSelectedData] = useState({
    id: '',
    name: '',
    nodes: []
  });

  const [filters, setFilters] = useState({
    area: [],
    sensorType: [],
    nodeAssignment: [],
    role: [],
    email: []
  });
  const location = useLocation();
  const navigate = useNavigate();

  const fetchNodes = (curFilter, verticalId) => {
    const requestUrl = curFilter === 'all' ? '/nodes/nodes-all' : `/nodes/nodes-all?vertical_id=${verticalId}`;
    axiosAuthInstance
      .get(requestUrl)
      .then((response) => {
        console.log('Response:', response.data);
        if (response.data.message === 'No nodes found for this user.' ||
          (Array.isArray(response.data.nodes) && response.data.nodes.length === 0)) {
          return;
        }

        const selectedItem = {

          id: verticalId,
          name: curFilter,
          nodes: response.data.map((node) => ({

            nodeID: node.node_name,
            nodeDomain: node.vertical_name,
            nodeSensorType: node.res_name,
            nodeOrid: node.orid,
            nodeDataOrid: node.data_orid,
            nodeArea: node.area,
            nodeTokenNumber: node.token_num,
            nodeSensorNumber: node.sensor_node_number,
            nodeName: node.name,
            isAssigned: !!node.assigned, // ensures it's always a boolean
            assigned_vendor: node.assigned_vendor || [] // Make sure this is included

          }))

        };

        setSelectedData(selectedItem);
      })
      .catch((err) => {
        SweetAlert.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error fetching node',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
          position: 'center-end'
        });
        console.error('Error fetching stats:', err);
      });
  };

  useEffect(() => {
    if (!fetchedVerticals) fetchAllVerticals();
    fetchUser();

    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');

    // Find vertical ID based on filter name
    const selectedVertical = filter === 'all' ? 'all' : verticals.find(v => v.name === filter);
    const verticalId = selectedVertical === 'all' ? 'all' : selectedVertical?.id;

    fetchNodes(filter, verticalId);
  }, [location, verticals]);

  const handleCheckboxChange = (filterName, value, checked) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters };

      if (filterName === 'nodeAssignment') {
        // First clear all previous selections
        updatedFilters.area = [];
        updatedFilters.sensorType = [];
        updatedFilters.role = [];
        updatedFilters.email = [];
        
        // Set the nodeAssignment value
        updatedFilters.nodeAssignment = value === 'all' ? [] : [value];
        
        if (value === 'assigned') {
          // Get only assigned nodes and their filters
          const assignedNodes = selectedData.nodes.filter(node => node.isAssigned);
          assignedNodes.forEach(node => {
            if (!updatedFilters.area.includes(node.nodeArea)) {
              updatedFilters.area.push(node.nodeArea);
            }
            if (!updatedFilters.sensorType.includes(node.nodeSensorType)) {
              updatedFilters.sensorType.push(node.nodeSensorType);
            }
            node.assigned_vendor?.forEach(vendor => {
              if (vendor.assigned_vendor_role && !updatedFilters.role.includes(vendor.assigned_vendor_role)) {
                updatedFilters.role.push(vendor.assigned_vendor_role);
              }
              if (vendor.assigned_vendor_name && !updatedFilters.email.includes(vendor.assigned_vendor_name)) {
                updatedFilters.email.push(vendor.assigned_vendor_name);
              }
            });
          });
        } else if (value === 'unassigned') {
          // Get only unassigned nodes and their filters
          const unassignedNodes = selectedData.nodes.filter(node => !node.isAssigned);
          unassignedNodes.forEach(node => {
            if (!updatedFilters.area.includes(node.nodeArea)) {
              updatedFilters.area.push(node.nodeArea);
            }
            if (!updatedFilters.sensorType.includes(node.nodeSensorType)) {
              updatedFilters.sensorType.push(node.nodeSensorType);
            }
          });
        }
        return updatedFilters;
      }

      // Update current filter
      updatedFilters[filterName] = checked
        ? [...updatedFilters[filterName], value]
        : updatedFilters[filterName].filter(item => item !== value);

      // Find related nodes for the current filter
      const relatedNodes = selectedData.nodes.filter(node => {
        switch (filterName) {
          case 'area': return node.nodeArea === value;
          case 'sensorType': return node.nodeSensorType === value;
          case 'nodeAssignment': return (value === 'assigned' && node.isAssigned) ||
            (value === 'unassigned' && !node.isAssigned);
          case 'role': return node.assigned_vendor?.some(v => v.assigned_vendor_role === value);
          case 'email': return node.assigned_vendor?.some(v => v.assigned_vendor_name === value);
          default: return false;
        }
      });

      if (!checked) {
        // When unchecking, clear all automatically selected filters
        Object.keys(updatedFilters)
          .filter(key => key !== filterName)
          .forEach(key => { updatedFilters[key] = []; });
        return updatedFilters;
      }

      // Handle selection case
      relatedNodes.forEach(node => {
        const status = node.isAssigned ? 'assigned' : 'unassigned';

        if (!updatedFilters.area.includes(node.nodeArea)) {
          updatedFilters.area.push(node.nodeArea);
        }
        if (!updatedFilters.sensorType.includes(node.nodeSensorType)) {
          updatedFilters.sensorType.push(node.nodeSensorType);
        }
        if (!updatedFilters.nodeAssignment.includes(status)) {
          updatedFilters.nodeAssignment.push(status);
        }

        node.assigned_vendor?.forEach(vendor => {
          if (vendor.assigned_vendor_role && !updatedFilters.role.includes(vendor.assigned_vendor_role)) {
            updatedFilters.role.push(vendor.assigned_vendor_role);
          }
          if (vendor.assigned_vendor_name && !updatedFilters.email.includes(vendor.assigned_vendor_name)) {
            updatedFilters.email.push(vendor.assigned_vendor_name);
          }
        });
      });

      return updatedFilters;
    });
  };

  const filterOptions = {
    area: [
      ...selectedData.nodes
        .reduce(
          (unique, node) =>
            unique.findIndex((uniqueNode) => uniqueNode.nodeArea === node.nodeArea) < 0
              ? [...unique, node]
              : unique,
          []
        )
        .map((node) => ({
          value: node.nodeArea,
          label: node.nodeArea
        }))
      // { value: 'unassigned', label: 'Unassigned' },
      // { value: 'assigned', label: 'Assigned' },
      // { value: 'all', label: 'All' },
      // { value: 'test1', label: 'Test1' },
      // { value: 'test2', label: 'Test2' },
      // { value: 'test3', label: 'Test3' }
    ],
    sensorType: selectedData.nodes
      .reduce(
        (unique, node) =>
          unique.findIndex((uniqueNode) => uniqueNode.nodeSensorType === node.nodeSensorType) < 0
            ? [...unique, node]
            : unique,
        []
      )
      .map((node) => ({
        value: node.nodeSensorType,
        label: node.nodeSensorType
      })),
    role: selectedData.nodes
      .flatMap(node => node.assigned_vendor || [])
      .reduce((unique, vendor) => {
        if (!vendor.assigned_vendor_role) return unique;
        if (unique.findIndex(item => item.value === vendor.assigned_vendor_role) >= 0) return unique;
        return [...unique, {
          value: vendor.assigned_vendor_role,
          label: vendor.assigned_vendor_role
        }];
      }, []),

    email: selectedData.nodes
      .flatMap(node => node.assigned_vendor || [])
      .reduce((unique, vendor) => {
        if (!vendor.assigned_vendor_name) return unique;
        if (unique.findIndex(item => item.value === vendor.assigned_vendor_name) >= 0) return unique;
        return [...unique, {
          value: vendor.assigned_vendor_name,
          label: vendor.assigned_vendor_name
        }];
      }, []),

    nodeAssignment: [
      {
        value: 'assigned',
        label: 'Assigned'
      },
      {
        value: 'unassigned',
        label: 'Unassigned'
      }
    ]
  };

  const filteredNodes = useMemo(() => {
    // First filter out nodes with null IDs
    const validNodes = selectedData.nodes.filter(node => node.nodeID != null);

    // Then apply the regular filters
    return validNodes.filter((node) =>
      (filters.area.length === 0 || filters.area.includes(node.nodeArea)) &&
      (filters.sensorType.length === 0 || filters.sensorType.includes(node.nodeSensorType)) &&
      (filters.nodeAssignment.length === 0 ||
        (filters.nodeAssignment.includes('assigned') && node.isAssigned) ||
        (filters.nodeAssignment.includes('unassigned') && !node.isAssigned)) &&
      (filters.role.length === 0 || node.assigned_vendor?.some(v => filters.role.includes(v.assigned_vendor_role))) &&
      (filters.email.length === 0 || node.assigned_vendor?.some(v => filters.email.includes(v.assigned_vendor_name)))
    );
  }, [selectedData.nodes, filters]);



  const handleVerticalClick = (nodeID) => {
    navigate(`/nodedata?filter=${encodeURIComponent(nodeID)}`);
  };

  const handleDeleteItem = (itemId) => {
    axiosAuthInstance
      .delete(`/nodes/delete-node/${itemId}`)
      .then((response) => {
        console.log(response);
        if (response.status === 200) {
          SweetAlert.fire({
            icon: 'success',
            title: 'Node Deleted Successfully',
            showConfirmButton: false,
            timer: 1500
          });
          fetchNodes(selectedData.name);
          window.reload.location(true);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleDeleteClick = (itemId) => {
    // data.filter((item) => item.id !== itemId);
    console.log(itemId);
    SweetAlert.fire({
      title: 'Are you sure?',
      text: `Do you want to delete?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Call the delete function or dispatch an action to delete the item
        handleDeleteItem(itemId);
      }
    });
  };
  // useEffect(() => {
  //   document.body.style.overflow = 'hidden'; // This hides the scrollbar globally

  //   return () => {
  //     document.body.style.overflow = ''; // Resets the scrollbar behavior when leaving the component or unmounting
  //   };
  // }, []);
  const handleChange = (event) => {
    const {
      target: { value }
    } = event;

    // Find the selected vertical's ID
    const selectedVertical = value === 'all' ? 'all' : verticals.find(v => v.name === value);
    const verticalId = selectedVertical === 'all' ? 'all' : selectedVertical?.id;

    fetchNodes(value, verticalId);

    // Encode value and replace %20 with +
    const encodedFilter = encodeURIComponent(value).replace(/%20/g, '+');
    navigate(`/details?filter=${encodedFilter}`);
  };


  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      overflowX: 'hidden'
    }}>
      <Box sx={{ mb: { xs: 1, sm: 2 } }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ 
            bgcolor: '#b4bce3', 
            color: 'black',
            p: { xs: '4px', sm: '8px' }
          }}
        >
          <ArrowBackIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        </IconButton>
      </Box>
      <FormControl sx={{ 
        m: { xs: 0.5, sm: 1 }, 
        width: '100%',
        '& .MuiInputLabel-root': {
          fontSize: { xs: '0.9rem', sm: '1rem' }
        },
        '& .MuiSelect-select': {
          fontSize: { xs: '0.9rem', sm: '1rem' }
        }
      }}>
        <InputLabel id="demo-multiple-name-label" sx={{ marginRight: 1, marginBottom: 1 }}>
          Select Domain
        </InputLabel>
        <Select
          labelId="demo-multiple-name-label"
          id="demo-multiple-name"
          multiple={false}
          value={selectedData ? selectedData.name : ''}
          onChange={handleChange}
          MenuProps={MenuProps}
          sx={{ flex: 1 }}
          label="Select Domain">
          <MenuItem value="all">All</MenuItem>
          {verticals.map((item) => (
            <MenuItem key={item.id} value={item.name}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filters Section */}
<Box sx={{ 
  backgroundColor: 'white', 
  padding: { xs: 0.5, sm: 1 },
  '& .MuiStack-root': {
    flexDirection: { xs: 'column', md: 'row' }
  },
  '& .MuiFormControlLabel-label': {
    fontSize: { xs: '0.8rem', sm: '0.9rem' }
  }
}}>
  <Grid container spacing={1} sx={{ marginTop: 2 }}>
    <Grid item xs={20}>
      <Stack direction="row" spacing={1}>
        {Object.entries(filterOptions).map(([filterName, options], index) => (
          <Box
            key={filterName}
            sx={{
              flex: 1,
              position: 'sticky',
              display: 'flex',
              flexDirection: 'column',
              
            }}
          >
            {/* Scrollable content inside filter section */}
            <Box sx={{maxHeight: '200px', // Set desired height
              overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
              <CheckboxFilter
                title={filterName.charAt(0).toUpperCase() + filterName.slice(1)}
                options={options}
                selectedOptions={filters[filterName]}
                onChange={(value, checked) =>
                  handleCheckboxChange(filterName, value, checked)
                }
              />
            </Box>

            {/* Divider after each filter section, except the last one */}
            {index !== Object.entries(filterOptions).length - 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: '2px',
                  backgroundColor: 'gray',
                }}
              />
            )}
          </Box>
        ))}
      </Stack>
    </Grid>
  </Grid>
</Box>


      {/* Nodes Section with Scroll */}
      <Box sx={{ 
        maxHeight: { xs: '50vh', sm: '60vh' },
        overflowY: 'auto',
        pt: { xs: 1, sm: 2 },
        pb: { xs: 1, sm: 2 }
      }}>
        {filteredNodes.length === 0 ? (
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              color: 'grey.600',
              padding: 3,
              backgroundColor: 'white',
              borderRadius: 1
            }}
          >
            No nodes available for the selected filters
          </Typography>
        ) : (
          <Stack spacing={2}>
            {filteredNodes.map((node) => (
              <StyledPaper key={node.nodeID} sx={{ marginBottom: '16px' }}> {/* Add marginBottom here */}
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6">{node.nodeName}</Typography>
                    <Typography variant="body1">
                      <strong>ID:</strong> {node.nodeID}
                      <br />
                      <strong>Domain</strong>: {node.nodeDomain}
                      <br />
                      <strong>Sensor Type</strong>: {node.nodeSensorType}

                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" alignItems="flex-end">
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleVerticalClick(node.nodeID)}
                      style={{ marginBottom: '8px' }}
                    >
                      View Node Details
                    </Button>
                    {user?.user_type !== 3 && (
                      <Box>
                        <IconButton onClick={() => handleDeleteClick(node.nodeID)} aria-label="Delete">
                          <DeleteIcon />
                        </IconButton>
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
                                    node_id: node.nodeID,
                                    vendor_email: result.value.email
                                  };

                                  axiosAuthInstance.post('/nodes/assign-vendor', payload)
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
                                        text: error.response?.data?.message || 'An error occurred while assigning vendor',
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
                      </Box>
                    )}
                  </Box>
                </Box>
              </StyledPaper>
            ))}
          </Stack>
        )}
      </Box>



      {/* FAB Button */}


      {user?.user_type !== 3 && (
        <Fab
          color="primary"
          aria-label="add"
          size="medium"
          sx={{
            position: 'fixed',
            bottom: { xs: 12, sm: 16 },
            right: { xs: 12, sm: 16 },
            '& .MuiTypography-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
          onClick={() => navigate(`/add?step=3`)}
        >
          <Typography variant="button">ADD</Typography>
        </Fab>
      )}

    </Box>
  );
}