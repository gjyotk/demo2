import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText
} from '@mui/material';
import Info from '@mui/icons-material/Info';

import FilterListIcon from '@mui/icons-material/FilterList';

import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

import { axiosAuthInstance } from '../services/axiosConfig';

// Update the common table styles at the top
const commonTableStyles = {
  '& .MuiTableCell-root': {
    padding: { xs: '6px 4px', sm: '8px 6px', md: '12px' },
    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
    lineHeight: '1.2',
    height: 'auto',
    minHeight: { xs: '40px', sm: '50px' },
    maxWidth: { xs: '120px', sm: '150px', md: '200px' },
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  '& .MuiTableCell-head': {
    fontWeight: 'bold',
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    height: 'auto'
  }
};

export default function UserManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, users, fetchedUser, fetchedUsers, fetchUserDetails, fetchUsers } =
    useContext(AuthContext);

  useEffect(() => {
    if (!fetchedUser) fetchUserDetails();
    if (!fetchedUsers && fetchedUser) fetchUsers();
  });

  
  useEffect(() => {
    axiosAuthInstance
      .get('/user/getusers')
      .then((response) => {
        console.log('Fetched users:', response.data);
        setVendors(response.data || []); // update this line
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching pending vendors:', error);
        setLoading(false);
      });
  }, []);
  const [requestsStatusAnchorEl, setRequestsStatusAnchorEl] = useState(null);
  const [requestsRoleAnchorEl, setRequestsRoleAnchorEl] = useState(null);
  const [requestsStatusFilters, setRequestsStatusFilters] = useState([]); // for checkbox values like 'approved', 'pending'
  const [requestsRoleFilters, setRequestsRoleFilters] = useState([]); // e.g., 1, 2, 3
  const handleRequestsStatusClick = (event) => setRequestsStatusAnchorEl(event.currentTarget);
  const handleRequestsRoleClick = (event) => setRequestsRoleAnchorEl(event.currentTarget);
  const handleCloseRequestsStatus = () => setRequestsStatusAnchorEl(null);
  const handleCloseRequestsRole = () => setRequestsRoleAnchorEl(null);

  const [usersRoleAnchorEl, setUsersRoleAnchorEl] = useState(null);
  const [usersRoleFilters, setUsersRoleFilters] = useState([]); // e.g., 1, 2, 3
  const handleUsersRoleClick = (event) => setUsersRoleAnchorEl(event.currentTarget);
  const handleCloseUsersRole = () => setUsersRoleAnchorEl(null);

  const filteredVendors = useMemo(() => {
    let data = vendors;

    if (user?.user_type === 1) {
      data = data.filter((v) => [1, 2, 3].includes(v.user_type));
    }
    if (user?.user_type === 2) {
      data = data.filter((v) => v.user_type === 3);
    }


    if (requestsRoleFilters.length > 0) {
      data = data.filter((v) => requestsRoleFilters.includes(v.user_type));
    }

    if (requestsStatusFilters.length > 0) {
      data = data.filter((v) => requestsStatusFilters.includes(v.status));
    }

    return data;
  }, [vendors, user, requestsStatusFilters, requestsRoleFilters]);

  const filteredUsers = useMemo(() => {
    let data = users;
    if (user?.user_type === 1) data = data.filter((u) => [1, 2, 3].includes(u.user_type));
    if (user?.user_type === 2) data = data.filter((u) => u.user_type === 3);

    // Filter only accepted users
    data = data.filter((u) => u.status === 'accepted');

    if (usersRoleFilters.length > 0) {
      data = data.filter((u) => usersRoleFilters.includes(u.user_type));
    }

    return data;
  }, [users, user, usersRoleFilters]);

  const toggleRequestsStatusFilter = (value) => {
    setRequestsStatusFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleRequestsRoleFilter = (value) => {
    setRequestsRoleFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleUsersRoleFilter = (value) => {
    setUsersRoleFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleUpdate = (userId) => {
    const editableFields = {
      username: user.username || '',
      email: user.email || '',
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      location: user.location || '',
      organisation: user.organisation || '',
      designation: user.designation || '',
      contact: user.contact || '',
      vendor_website: user.vendor_website || ''
    };

    const userToEdit = users.find((u) => u.id === userId);

    if (!userToEdit) return;

    const updatedUser = { ...userToEdit };

    const fieldOrder = [
      'firstname',
      'lastname',
      'username',
      'email',
      'contact',
      'location',
      'organisation',
      'designation',
      'vendor_website',
      'password'
    ];

    Swal.fire({
      title: `Edit User – ${updatedUser.username}`,
      width: 900,
      html: `
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 40px;
          row-gap: 15px;
          padding: 20px;
          box-sizing: border-box;
          font-size: 14px;
        ">
          ${fieldOrder
            .filter((key) => {
              const excluded = ['id', 'user_type', 'status', 'remarks'];
              if (excluded.includes(key)) return false;
              if (user.user_type !== 1 && key === 'password') return false;
              return true;
            })
            .map((key) => {
              const value = updatedUser[key] ?? '';
              const inputValue = key === 'password' ? '' : value;
              return `
                <div style="display: flex; align-items: center;">
                  <label for="${key}" style="width: 120px; font-weight: 500; margin-right: 8px; text-transform: capitalize;">
                    ${key.replace('_', ' ')}
                  </label>
                  <input
                    type="${key === 'password' ? 'password' : 'text'}"
                    id="${key}"
                    value="${inputValue}"
                    class="swal2-input"
                    style="flex: 1; margin: 0; height: 36px;"
                  />
                </div>`;
            })
            .join('')}
        </div>
      `,

      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const updatedData = {};
        Object.keys(editableFields).forEach((key) => {
          const input = document.getElementById(key);
          if (input) {
            updatedData[key] = input.value;
          }
        });
        return updatedData;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        axiosAuthInstance
          .put(`/user/update-user/${userId}`, result.value)
          .then((response) => {
            if (response.status === 200) {
              Swal.fire('Success', 'User updated successfully!', 'success');
              fetchUsers(); // refresh user list
            }
            window.location.reload();
          })

          .catch((error) => {
            console.error('Update user error:', error);
            Swal.fire('Error', 'Failed to update user', 'error');
          });
      }
    });
  };

  const handleDelete = (userId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This user will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        axiosAuthInstance
          .delete(`/user/delete-user/${userId}`)
          .then((response) => {
            if (response.status === 200) {
              Swal.fire('Deleted!', 'User has been deleted.', 'success');
              fetchUsers(); // refresh user list after deletion
            }
            window.location.reload();
          })
          .catch((error) => {
            console.error('Delete user error:', error);
            Swal.fire('Error', 'Failed to delete user', 'error');
          });
      }
    });
  };

  const handleApprove = async (email) => {
    // Show confirmation dialog
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to approve the vendor: ${email}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const response = await axiosAuthInstance.post(
            `/onboard/approve-vendor?email=${encodeURIComponent(email)}`
          );
          return response.data; // Pass to then() below
        } catch (error) {
          Swal.showValidationMessage(
            `Approval failed: ${error.response?.data?.message || error.message}`
          );
          throw error;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Vendor Approved',
          text: `Successfully approved ${email}`,
          timer: 1500,
          showConfirmButton: false
        });

        // Optional: delay slightly before reloading
        setTimeout(() => {
          setVendors((prev) => prev.filter((v) => v.email !== email));
          window.location.reload(); // or navigate to refresh view
        }, 1600);
      }
    });
  };

  const handleReject = (email) => {
    Swal.fire({
      title: 'Reject Vendor',
      text: `Please provide a reason for rejecting the vendor: ${email}`,
      input: 'textarea',
      inputPlaceholder: 'Enter remarks here...',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel',
      preConfirm: (remarks) => {
        if (!remarks) {
          Swal.showValidationMessage('Remarks are required');
          return false;
        }
        return remarks; // Will be in result.value
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const remarks = result.value;

        // Show loading
        Swal.fire({
          title: 'Processing...',
          text: 'Rejecting vendor...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Send the POST request with the remarks
        axiosAuthInstance
          .post(`/onboard/reject-vendor/${encodeURIComponent(email)}`, { remarks })
          .then((response) => {
            console.log('Rejection successful:', response.data);

            Swal.fire({
              icon: 'success',
              title: 'Vendor Rejected',
              text: `Successfully rejected ${email}`,
              timer: 2000,
              showConfirmButton: false
            });

            window.location.reload();
            setVendors((prev) => prev.filter((v) => v.email !== email));
          })
          .catch((error) => {
            console.error('Rejection failed:', error);

            Swal.fire({
              icon: 'error',
              title: 'Rejection Failed',
              text: `Could not reject ${email}`
            });
          });
      }
    });
  };

  const handleShowRemarks = (remarks) => {
    Swal.fire({
      title: 'Rejection Remarks',
      text: remarks || 'No remarks provided',
      icon: 'info',
      confirmButtonText: 'Close'
    });
  };
  const roleLabels = {
    1: 'admin',
    2: 'vendor',
    3: 'vendor-operator'
  };

  return (
    <Box sx={{ mt: 3, width: '100%', px: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          mb: 1
        }}>
        <Typography variant="h5" gutterBottom>
          Requests
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" onClick={() => navigate('/create-user')}>
            Create User
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            height: { xs: 'calc(100vh - 500px)', sm: 'calc(100vh - 350px)' },
            overflowY: 'auto',
            ...commonTableStyles,
            '& .MuiTable-root': {
              tableLayout: 'fixed',
              width: '100%',
            },
            '& .MuiTableCell-root': {
              ...commonTableStyles['& .MuiTableCell-root'],
              borderRight: 'none' // Remove vertical grid lines
            }
          }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Username</TableCell> */}
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  First Name
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Last Name
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Organisation
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Designation
                </TableCell>

                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Contact
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Email
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Vendor Website
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Location
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Role{' '}
                  <IconButton size="small" onClick={handleRequestsRoleClick}>
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={requestsRoleAnchorEl}
                    open={Boolean(requestsRoleAnchorEl)}
                    onClose={handleCloseRequestsRole}>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <MenuItem key={value} onClick={() => toggleRequestsRoleFilter(Number(value))}>
                        <Checkbox checked={requestsRoleFilters.includes(Number(value))} />
                        <ListItemText primary={label} />
                      </MenuItem>
                    ))}
                  </Menu>
                </TableCell>

                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                  Status
                  <IconButton size="small" onClick={handleRequestsStatusClick}>
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: 0,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}
                  align="center">
                  Approval
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.username}>
                  <TableCell   sx={{
    maxWidth: { xs: '120px', sm: '150px', md: '200px' },
    wordBreak: 'break-word',
    whiteSpace: 'normal'
  }}
>{vendor.firstname}</TableCell>
                  <TableCell   sx={{
    maxWidth: { xs: '120px', sm: '150px', md: '200px' },
    wordBreak: 'break-word',
    whiteSpace: 'normal'
  }}
>{vendor.lastname}</TableCell>
                  <TableCell>{vendor.organisation}</TableCell>
                  <TableCell>{vendor.designation}</TableCell>
                  <TableCell>{vendor.contact}</TableCell>
                  {/* <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '10ch' }}> */}
                  <TableCell
  sx={{
    maxWidth: { xs: '120px', sm: '150px', md: '200px' },
    wordBreak: 'break-word',
    whiteSpace: 'normal'
  }}
>
  {vendor.email}
</TableCell>

                  {/* </div> */}
                  <TableCell>{vendor.vendor_website}</TableCell>
                  <TableCell>{vendor.location}</TableCell>
                  <TableCell>
                    {(() => {
                      if (vendor.user_type === 1) {
                        return 'Admin';
                      }
                      if (vendor.user_type === 2) {
                        return 'Vendor';
                      }
                      if (vendor.user_type === 3) {
                        return 'Vendor-Operator';
                      }
                      return 'Unknown';
                    })()}
                  </TableCell>

                  <TableCell>{vendor.status}</TableCell>
                  <TableCell sx={{ 
  minWidth: { xs: '80px', sm: '100px', md: '120px' },
  padding: 1
}}>
  {vendor.status === 'approved' && (
    <CheckCircle sx={{ color: 'grey', fontSize: '1.5rem' }} />
  )}
  
  {vendor.status === 'pending' && (
    <Box sx={{ 
      display: 'flex',
      flexDirection: { xs: 'column', lg: 'row' },
      gap: 1,
      alignItems: 'center'
    }}>
      <IconButton 
        onClick={() => handleApprove(vendor.email)}
      >
        <CheckCircle sx={{ color: 'grey' }} />
      </IconButton>
      <IconButton 
        onClick={() => handleReject(vendor.email)}
      >
        <Cancel sx={{ color: 'lightgrey' }} />
      </IconButton>
    </Box>
  )}
  
  {vendor.status === 'rejected' && (
    <Box sx={{ 
      display: 'flex',
      flexDirection: { xs: 'column', lg: 'row' },
      gap: 1,
      alignItems: 'center'
    }}>
      <IconButton 
        onClick={() => handleApprove(vendor.email)}

      >
        <CheckCircle sx={{ color: 'grey' }} />
      </IconButton>
      <IconButton 
        onClick={() => handleShowRemarks(vendor.remarks)}

      >
        <Info sx={{ color: '#123462' }} />
      </IconButton>
    </Box>
  )}
</TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && vendors.length === 0 && (
        <Typography variant="h6" color="textSecondary" align="center">
          User requests not available
        </Typography>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Existing Users
        </Typography>

        <Box sx={{ mb: 2}}>
          <TableContainer 
            component={Paper} 
            sx={{
              height: { xs: 'calc(100vh - 400px)', sm: 'calc(100vh - 350px)' },
              overflowY: 'auto',
              ...commonTableStyles,
              '& .MuiTable-root': {
                tableLayout: 'fixed',
                width: '100%',
              },
              '& .MuiTableCell-root': {
                ...commonTableStyles['& .MuiTableCell-root'],
                borderRight: 'none' // Remove vertical grid lines
              }
            }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}>
                    First Name
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}>
                    Last Name
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}>
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}>
                    Role{' '}
                    <IconButton size="small" onClick={handleUsersRoleClick}>
                      {user?.user_type === 1 && <FilterListIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}>
                    Creation Time
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}>
                    Last Login
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((cuser) => (
                  <TableRow key={cuser.id}>
                    <TableCell  sx={{
    maxWidth: { xs: '120px', sm: '150px', md: '200px' },
    wordBreak: 'break-word',
    whiteSpace: 'normal'
  }}>{cuser.firstname}</TableCell>
                    <TableCell  sx={{
    maxWidth: { xs: '120px', sm: '150px', md: '200px' },
    wordBreak: 'break-word',
    whiteSpace: 'normal'
  }}>{cuser.lastname}</TableCell>
                    <TableCell  sx={{
    maxWidth: { xs: '120px', sm: '150px', md: '200px' },
    wordBreak: 'break-word',
    whiteSpace: 'normal'
  }}>{cuser.email}</TableCell>

                    <TableCell>
                      {(() => {
                        if (cuser.user_type === 1) {
                          return 'Admin';
                        }
                        if (cuser.user_type === 2) {
                          return 'Vendor';
                        }
                        if (cuser.user_type === 3) {
                          return 'Vendor-Operator';
                        }
                        return 'Unknown';
                      })()}
                    </TableCell>

                    <TableCell>{cuser.timestamp}</TableCell>
                    <TableCell>{cuser.lastlogin}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleUpdate(cuser.id)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cuser.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      <Menu
        anchorEl={requestsStatusAnchorEl}
        open={Boolean(requestsStatusAnchorEl)}
        onClose={handleCloseRequestsStatus}>
        {['accepted', 'pending', 'rejected'].map((status) => (
          <MenuItem key={status} onClick={() => toggleRequestsStatusFilter(status)}>
            <Checkbox checked={requestsStatusFilters.includes(status)} />
            <ListItemText primary={status} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={requestsRoleAnchorEl}
        open={Boolean(requestsRoleAnchorEl)}
        onClose={handleCloseRequestsRole}>
        {[1, 2, 3].map((role) => (
          <MenuItem key={role} onClick={() => toggleRequestsRoleFilter(role)}>
            <Checkbox checked={requestsRoleFilters.includes(role)} />
            <ListItemText primary={roleLabels[role]} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={usersRoleAnchorEl}
        open={Boolean(usersRoleAnchorEl)}
        onClose={handleCloseUsersRole}>
        {[1, 2, 3].map((role) => (
          <MenuItem key={role} onClick={() => toggleUsersRoleFilter(role)}>
            <Checkbox checked={usersRoleFilters.includes(role)} />
            <ListItemText primary={roleLabels[role]} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
