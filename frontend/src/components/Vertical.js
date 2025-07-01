import React, { useContext, useEffect, useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/system';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { Fab, Menu, MenuItem, RadioGroup, Radio, FormControl, FormLabel } from '@mui/material';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import PanToolAltIcon from '@mui/icons-material/PanToolAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import { useNavigate } from 'react-router-dom';
import SweetAlert from 'sweetalert2';
import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';



const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  cursor: 'pointer',
  '&:hover': {
    cursor: `url(${PanToolAltIcon}) 0 0, auto`
  }
}));


const Vertical = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { verticals, fetchAllVerticals, fetchedVerticals, fetchUser, user } = useContext(DataContext);

  const [anchorElForItem, setAnchorElForItem] = useState(null);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [assignedFilter, setAssignedFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [availableEmails, setAvailableEmails] = useState([]);
  const [userVerticalsData, setUserVerticalsData] = useState([]);

  useEffect(() => {
    if (!fetchedVerticals) fetchAllVerticals();
    fetchUser();

    if (user) {
      // console.log('Fetched user in Vertical.js:', user);
    }
  }, []);

  // When verticals are available, process them
  useEffect(() => {
    if (!fetchedVerticals || verticals.length === 0) return;

    console.log("Raw vertical data:", verticals);

    // Assuming each item in verticals came from response.data
    verticals.forEach((item, index) => {
      console.log(`Assigned Vendors for item ${index + 1}:`, item.assigned_vendor);
    });

    const allAssignedVendors = verticals.flatMap(item => item.assigned_vendor || []);

    if (allAssignedVendors.length === 0) {
      console.warn("No assigned vendors found.");
      return;
    }

    setUserVerticalsData(allAssignedVendors);

    const emails = [...new Set(allAssignedVendors.map(vendor => vendor.assigned_vendor_name))];
    const roles = [...new Set(allAssignedVendors.map(vendor => vendor.assigned_vendor_role))];


    console.log("All Assigned Vendor Emails:", emails);
    console.log("All Assigned Vendor Roles:", roles);

    setAvailableEmails(emails);
    setAvailableRoles(roles);

  }, [fetchedVerticals, verticals]); // re-run when verticals are updated

  // Example usage of userVerticalsData
  console.log(userVerticalsData);  // just for debugging or use it in rendering
  // Example usage of userVerticalsData
  console.log(availableEmails);  // just for debugging or use it in rendering



  const handleVerticalClick = (verticalId) => {
    navigate(`/details?filter=${encodeURIComponent(verticalId)}`);
  };

  const handleDeleteItem = (itemId) => {
    axiosAuthInstance
      .delete(`/verticals/delete-ae/${itemId}`)
      .then((response) => {
        if (response.status === 204) {
          SweetAlert.fire({
            icon: 'success',
            title: 'Vertical Deleted Successfully',
            showConfirmButton: false,
            timer: 1500
          });
          fetchAllVerticals();
        }
      })
      .catch((error) => {
        SweetAlert.fire({
          icon: 'error',
          title: 'Error',
          text: error?.response?.data?.detail || 'Error Deleting Vertical',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          position: 'center-end'
        });
      });
  };

  const handleDeleteClick = (itemId) => {
    SweetAlert.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteItem(itemId);
      }
    });
  };




  const handleEditClick = (verticalId) => {
    console.log('Navigating to DataModel with ID:', verticalId); // Log the ID being sent
    navigate(`/datamodel?filter=${encodeURIComponent(verticalId)}`);
  };

  const handleRoleChange = (role, checked) => {
    setSelectedRoles((prevSelectedRoles) => {
      const newRoles = checked
        ? [...prevSelectedRoles, role]
        : prevSelectedRoles.filter((r) => r !== role);

      const updatedEmails = verticals
        .flatMap((v) => v.assigned_vendor)
        .filter((vendor) => newRoles.includes(vendor.assigned_vendor_role))
        .map((v) => v.assigned_vendor_name);

      setSelectedEmails([...new Set(updatedEmails)]);

      const hasAssigned = verticals.some(
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

      const hasAssigned = verticals.some(
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
    if (value === 'assigned') {
      const assignedVerticals = verticals.filter((v) => v.assigned);
      const assignedVendors = assignedVerticals.flatMap((v) => v.assigned_vendor);
      const roles = assignedVendors.map((v) => v.assigned_vendor_role);
      const emails = assignedVendors.map((v) => v.assigned_vendor_name);

      setSelectedRoles([...new Set(roles)]);
      setSelectedEmails([...new Set(emails)]);
    } else {
      // Either unassigned or all: clear selections
      setSelectedRoles([]);
      setSelectedEmails([]);
    }

    setAssignedFilter(value);
  };


  const filteredVerticals = verticals.filter((vertical) => {
    const roleMatch = selectedRoles.length === 0 ||
      vertical.assigned_vendor.some((v) =>
        selectedRoles.includes(v.assigned_vendor_role)
      );

    const emailMatch = selectedEmails.length === 0 ||
      vertical.assigned_vendor.some((v) =>
        selectedEmails.includes(v.assigned_vendor_name)
      );

    const assignedMatch =
      assignedFilter === 'all' ||
      (assignedFilter === 'assigned' && vertical.assigned === true) ||
      (assignedFilter === 'unassigned' && vertical.assigned === false);

    return roleMatch && emailMatch && assignedMatch;
  });


  return (
    <Box sx={{ p: 3, flexGrow: 1 }}>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
            <ArrowBackIcon />
          </IconButton>
          {user?.user_type === 1 && (
            <IconButton onClick={() => navigate('/domainmanagement')} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
              <SettingsIcon />
            </IconButton>
          )}
        </Box>

        {/* Row to align TextField and IconButton side by side */}
        <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
          <TextField
            label="Search Domain"
            variant="outlined"
            fullWidth
            margin="normal"
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />

        </Box>

        <Box sx={{ height: 'auto', overflowY: 'auto' }}>
  {/* Roles, Emails, Vendor Filters */}
  <Box
    sx={{
      p: 2,
      display: 'flex',
      flexWrap: 'wrap', // allow wrapping on small screens
      background: '#fff',
      justifyContent: 'space-between',
      gap: 2,
    }}
  >
    {/* Roles Filter */}
    <Box sx={{ flex: '1 1 250px', pr: 2, minWidth: 0 }}>
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
                  onChange={(event) => handleRoleChange(role, event.target.checked)}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.75rem' }}>{role}</Typography>
              }
            />
          ))}
        </FormGroup>
      </Box>
    </Box>

    <Divider
      orientation="vertical"
      flexItem
      sx={{
        display: { xs: 'none', md: 'block' }, // hide on small screens
        borderRightWidth: 3,
        backgroundColor: 'gray',
        mx: 2,
      }}
    />

    {/* Emails Filter */}
    <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
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
                  onChange={(event) => handleEmailChange(email, event.target.checked)}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                  }}
                >
                  {email}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </Box>
    </Box>

    <Divider
      orientation="vertical"
      flexItem
      sx={{
        display: { xs: 'none', md: 'block' }, // hide on small screens
        borderRightWidth: 3,
        backgroundColor: 'gray',
        mx: 2,
      }}
    />

    {/* Vendor Assignment Status */}
    <Box sx={{ flex: '1 1 250px', pl: 2, minWidth: 0 }}>
      <FormControl component="fieldset">
        <FormLabel component="legend">
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Vendor Assignment Status
          </Typography>
        </FormLabel>
        <RadioGroup
          value={assignedFilter}
          onChange={(e) => handleAssignedFilterChange(e.target.value)}
        >
          <FormControlLabel
            value="all"
            control={<Radio />}
            label={<Typography sx={{ fontSize: '0.75rem' }}>All</Typography>}
          />
          <FormControlLabel
            value="assigned"
            control={<Radio />}
            label={<Typography sx={{ fontSize: '0.75rem' }}>Assigned</Typography>}
          />
          <FormControlLabel
            value="unassigned"
            control={<Radio />}
            label={<Typography sx={{ fontSize: '0.75rem' }}>Unassigned</Typography>}
          />
        </RadioGroup>
      </FormControl>
    </Box>
  </Box>
</Box>

      </Box>


      <Grid container spacing={3}>
        {filteredVerticals.filter((item) => {
          // Always filter by search term (if provided)
          const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

          // If no roles or emails are selected, show all items
          if (selectedRoles.length === 0 && selectedEmails.length === 0) {
            return matchesSearch; // Only apply search term filtering
          }

          // Filter by selected roles and emails using userVerticalsData
          const isLinkedToSelectedUser = item.assigned_vendor?.some(vendor =>
            (selectedRoles.length === 0 || selectedRoles.includes(vendor.assigned_vendor_role)) &&
            (selectedEmails.length === 0 || selectedEmails.includes(vendor.assigned_vendor_name))
          );


          // Return true if both search and user filtering match
          return matchesSearch && isLinkedToSelectedUser;
        })
          .map((item) => (
            <Grid key={item.id} item xs={4}>
              <div style={{ position: 'relative' }}>
                <Item
                  onClick={() => handleVerticalClick(item.name)}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  sx={{
                    p: 4,
                    border: hoveredItemId === item.id ? '2px solid #1976d2' : '1px solid #ccc',
                    boxShadow: hoveredItemId === item.id ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
                    transition: 'all 0.3s ease-in-out',
                    backgroundColor: hoveredItemId === item.id ? '#e3f2fd' : '#fff',
                  }}
                >
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </Item>


                <div style={{ position: 'absolute', top: 0, right: 0 }}>
                  {(user?.user_type === 2 || user?.user_type === 1) && (
                    <div
                      onMouseEnter={(e) => setAnchorElForItem({ el: e.currentTarget, id: item.id })}
                      onMouseLeave={() => setAnchorElForItem(null)}
                    >
                      <IconButton>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorElForItem?.el}
                        open={Boolean(anchorElForItem) && anchorElForItem.id === item.id}
                        onClose={() => setAnchorElForItem(null)}
                        MenuListProps={{
                          onMouseEnter: () => { },
                          onMouseLeave: () => setAnchorElForItem(null),
                        }}
                      >
                        {user?.user_type === 1 && (
                          <>
                            <MenuItem onClick={() => {
                              handleEditClick(item.name);
                              setAnchorElForItem(null);
                            }}>
                              <EditIcon fontSize="small" style={{ marginRight: 8 }} />
                              Edit
                            </MenuItem>
                            <MenuItem onClick={() => {
                              handleDeleteClick(item.id);
                              setAnchorElForItem(null);
                            }}>
                              <DeleteIcon fontSize="small" style={{ marginRight: 8 }} />
                              Delete
                            </MenuItem>
                          </>
                        )}
                        <MenuItem onClick={async () => {
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
                                axiosAuthInstance.post('/verticals/assign-vendor', {
                                  vertical_id: item.id,
                                  vendor_type: result.value.vendorType,
                                  vendor_email: result.value.email,
                                })
                                  .then(() => {
                                    SweetAlert.fire({
                                      icon: 'success',
                                      title: 'Vendor Assigned Successfully',
                                      text: `Assigned to: ${result.value.email}`,
                                      showConfirmButton: false,
                                      timer: 2000
                                    });
                                  })
                                  .catch((err) => {
                                    const errorMsg = err?.response?.data?.detail || 'Failed to assign vendor';
                                    SweetAlert.fire({
                                      icon: 'error',
                                      title: 'Assignment Failed',
                                      text: errorMsg,
                                      showConfirmButton: false,
                                      timer: 2000
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

                          setAnchorElForItem(null);
                        }}>
                          <PersonAddAltIcon fontSize="small" style={{ marginRight: 8 }} />
                          Assign Vendor
                        </MenuItem>
                      </Menu>
                    </div>
                  )}
                </div>

              </div>
            </Grid>
          ))}
        {verticals.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .length === 0 && (
            <Grid item xs={12}>
              <Item>
                <p>Domains are not available</p>
              </Item>
            </Grid>
          )}
      </Grid>

      {user?.user_type !== 3 && (
        <Fab
          color="primary"
          aria-label="add"
          style={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => navigate(`/add?step=1`)}>
          <Typography variant="button">ADD</Typography>
        </Fab>
      )}


    </Box>
  );
};

export default Vertical;