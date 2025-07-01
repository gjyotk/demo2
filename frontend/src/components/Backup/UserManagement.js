import React, { useEffect, useState, useContext,useMemo } from 'react';
import {
  Box, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, IconButton,    Button,
  MenuItem, Select, FormControl, InputLabel

} from '@mui/material';

import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; 
// import { CheckCircle, Cancel } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

import { axiosAuthInstance } from '../services/axiosConfig';

export default function UserManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
 const {user, users, fetchedUser, fetchedUsers,fetchUserDetails, fetchUsers} = useContext(AuthContext);

 const filteredVendors = useMemo(() => {
  if (user?.user_type === 1) {
    return vendors.filter((v) => v.user_type === 1 || v.user_type === 2 );
  }
  if (user?.user_type === 2) {
    return vendors.filter((v) => v.user_type ===3);
  }
  if (user?.user_type === 3) {
    alert('You are not authorized to access this page.');
      navigate('/home');
    
  }
  return vendors;
}, [vendors, user]);

const filteredUsers = useMemo(() => {
  if (user?.user_type === 1) {
    return users.filter((u) => u.user_type === 1 || u.user_type === 2 || u.user_type === 3);
  }
  if (user?.user_type === 2) {
    return users.filter((u) => u.user_type === 3);
  }
  if (user?.user_type === 3) {
    alert('You are not authorized to access this page.');
    navigate('/home');
  }
  return users;
}, [users, user]);


 useEffect(() => {
  if (!fetchedUser) fetchUserDetails();
  if (!fetchedUsers && fetchedUser) fetchUsers();
});
  useEffect(() => {

    axiosAuthInstance
      .get('/user/getusers')
      .then((response) => {
  
        setVendors(response.data || []);  // update this line
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching pending vendors:', error);
        setLoading(false);
      });
  }
  , []);
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
            .filter(key => {
              const excluded = ['id','user_type','status','remarks'];
              if (excluded.includes(key)) return false;
              if (user.user_type !== 1 && key === 'password') return false;
              return true;
            })
            .map(key => {
              const value = updatedUser[key] ?? '';
              const inputValue = key === 'password' ? '' : value;
              return `
                <div style="display: flex; align-items: center;">
                  <label for="${key}" style="width: 120px; font-weight: 500; margin-right: 8px; text-transform: capitalize;">
                    ${key.replace('_',' ')}
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
              Swal.fire({
      icon: 'success',
      title: 'success',
      text: 'User updated successfully',
      showConfirmButton: false,
      timer: 1500,
      toast: true,
      position: 'center-end'
    });
              fetchUsers(); // refresh user list
            }
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
        confirmButtonText: 'Yes, delete it!',
      }).then((result) => {
        if (result.isConfirmed) {
          axiosAuthInstance
            .delete(`/user/delete-user/${userId}`)
            .then((response) => {
              if (response.status === 200) {
                Swal.fire('Deleted!', 'User has been deleted.', 'success');
                fetchUsers(); // refresh user list after deletion
              }
            })
            .catch((error) => {
              console.error('Delete user error:', error);
              Swal.fire('Error', 'Failed to delete user', 'error');
            });
        }
      });
    };const handleApprove = async (email) => {
      // Show confirmation dialog
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to approve the vendor with email: ${email}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await axiosAuthInstance.post(`/onboard/approve-vendor/email=${encodeURIComponent(email)}`);
            console.log('Approval successful:', response.data);
        
            Swal.fire({
              icon: 'success',
              title: 'Vendor Approved',
              text: `Successfully approved ${email}`,
              timer: 2000,
              showConfirmButton: false,
            });
            window.location.reload();
            // Remove the approved vendor from the list
            setVendors(prev => prev.filter(v => v.email !== email));
          } catch (error) {
            console.error('Approval failed:', error);
        
            Swal.fire({
              icon: 'error',
              title: 'Approval Failed',
              text: `Could not approve ${email}`,
            });
          }
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
        return remarks; // Return the remarks to be used later
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const remarks = result.value;
  
        // Now send the POST request with the remarks
        axiosAuthInstance
          .post(`/onboard/reject-vendor/${encodeURIComponent(email)}`, { remarks })
          .then((response) => {
            console.log('Rejection successful:', response.data);
  
            Swal.fire({
              icon: 'success',
              title: 'Vendor Rejected',
              text: `Successfully rejected ${email}`,
              timer: 2000,
              showConfirmButton: false,
            });
            window.location.reload();
            // Optionally, remove the rejected vendor from the list
            setVendors((prev) => prev.filter((v) => v.email !== email));
          })
          .catch((error) => {
            console.error('Rejection failed:', error);
  
            Swal.fire({
              icon: 'error',
              title: 'Rejection Failed',
              text: `Could not reject ${email}`,
            });
          });
      }
    });
  };
  


  return (
    <Box sx={{ mt: 4, width: '100%', px: 2,  }}>
<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
  <Typography variant="h5" gutterBottom>
    Requests
  </Typography>

    <Box sx={{ display: 'flex', justifyContent: 'flex-end'}}>
      <Button variant="contained" color="secondary" onClick={() => navigate('/create-user')}>
        Create User
      </Button>
    </Box>
 
</Box>


      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}  sx={{
          maxHeight: 350,            // or '60vh', or whatever you like
          overflowY: 'auto',         // enable vertical scrolling
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Username</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>First Name</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Last Name</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Email</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Contact</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Location</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Organisation</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Designation</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Vendor Website</TableCell>
       <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Status</TableCell>
                <TableCell   sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }} align="center">Approval</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {filteredVendors.map((vendor) => (

                <TableRow key={vendor.username}>
                  <TableCell>{vendor.username}</TableCell>
                  <TableCell>{vendor.firstname}</TableCell>
                  <TableCell>{vendor.lastname}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.contact}</TableCell>
                  <TableCell>{vendor.location}</TableCell>
                  <TableCell>{vendor.organisation}</TableCell>
                  <TableCell>{vendor.designation}</TableCell>
                  <TableCell>{vendor.vendor_website}</TableCell>
                  <TableCell>{vendor.status}</TableCell>
                  <TableCell>
  {vendor.status === 'approved' && (
    <span>Approved</span>
  )}
  {vendor.status === 'pending' && (
    <FormControl>
      {/* <InputLabel id={`select-status-label-${vendor.email}`}>Status</InputLabel> */}
      <Select
        labelId={`select-status-label-${vendor.email}`}
        value={vendor.status}
        onChange={(e) => {
          if (e.target.value === 'approved') {
            handleApprove(vendor.email);
          } else if (e.target.value === 'rejected') {
            handleReject(vendor.email);
          }
        }}
      >
        <MenuItem value="approved">Approve</MenuItem>
        <MenuItem value="rejected">Reject</MenuItem>
      </Select>
    </FormControl>
  )}
  {vendor.status === 'rejected' && (
    <FormControl>
      <InputLabel id={`select-status-label-${vendor.email}`}>Status</InputLabel>
      <Select
        labelId={`select-status-label-${vendor.email}`}
        value={vendor.status}
        onChange={(e) => {
          if (e.target.value === 'approved') {
            handleApprove(vendor.email);
          } else if (e.target.value === 'rejected') {
            handleReject(vendor.email);
          }
        }}
      >
        <MenuItem value="approved">Approve</MenuItem>
        <MenuItem value="rejected">Reject</MenuItem>
      </Select>
    </FormControl>
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
      
     
         <Box sx={{mb:2,maxHeight: 400, overflow: 'auto'  }}>

      <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }} aria-label="user table">
          <TableHead>
            <TableRow>
              <TableCell sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Name</TableCell>
              <TableCell sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Email</TableCell>
              <TableCell sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Role</TableCell>
              <TableCell sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Creation Time</TableCell>
              <TableCell sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Last Login</TableCell>
              <TableCell sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {filteredUsers.map((cuser) => (

              <TableRow key={cuser.id}>
                <TableCell>{cuser.username}</TableCell>
                <TableCell>{cuser.email}</TableCell>

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
    </Box>
  );
}
