import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  
  TextField,
  Typography,

  CardHeader,
  IconButton,
    // Table,
    // TableBody,
    // TableCell,
    // TableContainer,
    // TableHead,
    // TableRow,
    // Paper,
    // Container
} from '@mui/material';

import { DataGrid } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import EditIcon from '@mui/icons-material/Edit';

import { axiosAuthInstance } from '../services/axiosConfig';
import { AuthContext } from '../contexts/AuthContext';
import { DataContext } from '../contexts/DataContext';


const columns = [
  { field: 'node_id', headerName: 'Node ID', width: 300 },
  { field: 'created_date', headerName: 'Created Date', width: 400 },
  { field: 'url', headerName: 'URL', width: 400}
];

const UserProfile = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const {setIsUserFetched} = useContext(DataContext);
  // const [user, setUser] = useState(null);
  // const [users, setUsers] = useState([]);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const {user, users, setUser, fetchedUser, fetchedUsers, fetchUserDetails, fetchUsers} = useContext(AuthContext)
  const [userSubscriptions, setUserSubscriptions] = useState([])
  const handleLogout = () => {
    logout();
    setUser(null);
    setIsUserFetched(false);
    navigate('/');
  };

  useEffect(() => {
    if (!fetchedUser) fetchUserDetails();
    if (!fetchedUsers && fetchedUser) fetchUsers();
  });

  const handlePasswordChange = () => {
    // check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'New password and confirm password do not match', 'error');
      return;
    }
    // if one of the fields is empty
    if (!oldPassword || !newPassword || !confirmPassword) {
      Swal.fire('Error', 'All fields are required', 'error');
      return;
    }

    axiosAuthInstance
      .post('/user/change-password', {
        email: user.email,
        old_password: oldPassword,
        new_password: newPassword
      })
      .then((response) => {
        if (response.status === 200) {
          Swal.fire('Success', 'Password changed successfully', 'success');
        }
      })
      .catch((error) => {
        console.error('Error changing password', error);
        if (error.response) Swal.fire('Error', error.response.data.detail, 'error');
        else Swal.fire('Error', 'Failed to change password', 'error');
      });
  };

  const getUserSubscriptions = () => {
    axiosAuthInstance
      .get('/nodes/get-user-subscriptions')
      .then((response) => {
        if (response.status === 200) {
          // update the created date to a more readable format
          for (let i = 0; i < response.data.length; i+=1) {
            response.data[i].created_date = new Date(response.data[i].created_date).toLocaleString();
          }
          setUserSubscriptions(response.data);
          console.log('User subscriptions', response.data);
        }
      })
      .catch((error) => {
        console.error('Error getting user subscriptions', error);
        if (error.response) Swal.fire('Error', error.response.data.detail, 'error');
        else Swal.fire('Error', 'Failed to get user subscriptions', 'error');
      });
  };

  useEffect(() => {
    if (fetchedUser) {
      getUserSubscriptions();
    }
  }, [user]);


  if (!user) {
    return <div>Loading...</div>;
  }

  // const permissionMatrix = {
  //   'Domain Creation': ['✔', '✔', '✖', '✖'],
  //   'Domain Update/Delete': ['✔', '✖', '✖', '✖'],
  //   'SensorType Creation': ['✔', '✔', '✔', '✖'],
  //   'SensorType Update/Delete': ['✔', '✔', '✔', '✖'],
  //   'Node Creation': ['✔', '✔', '✔', '✖'],
  //   'Node Update/Delete': ['✔', '✔', '✔', '✖'],
  //   'Data Posting': ['✔', '✔', '✔', '✔']
  // };

  // const roles = ['Admin', 'Vendor', 'Vendor-Operator', 'User'];

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
                  title: 'Success',
                  text: 'User updated successfully!',
                  showConfirmButton: false,
                  timer: 1500,
                  position: 'center'
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
  

 
  

  return (
    <Box sx={{ m: 2 }}>
<Card sx={{ mb: 2 }}>
  <CardContent>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h4">User Profile</Typography>
      

  <IconButton
    onClick={() => {
      const nonAdminUser = users.find((u) => u.username === user.username); // 🔧 find user by username
      if (nonAdminUser) {
        handleUpdate(nonAdminUser.id); // 🔧 use their ID
      } else {
        console.warn('User not found in users array');
      }
    }}
  >
    <EditIcon />
  </IconButton>


    </Box>

    <Typography variant="h6">Name: {user.username}</Typography>
    <Typography variant="h6">Email: {user.email}</Typography>
  </CardContent>
</Card>

      <Card sx={{ mb: 2 }}>
        <CardHeader
          title={
            <Typography variant="h4" component="div">
              Subscriptions
            </Typography>
          }
        />
        <CardContent>
            {userSubscriptions.length > 0 ? (
                <DataGrid
                    rows={userSubscriptions}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 5 },
                        },
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    // checkboxSelection
                    autoHeight
                    disableSelectionOnClick
                />
            ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="h6" color="textSecondary">
                        No subscriptions
                    </Typography>
                </Box>
            )}
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5">Change Password</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Old Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button variant="contained" color="primary" onClick={handlePasswordChange}>
              Change Password
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" mt={2}>

                    {user?.user_type !== 3 && (

<Button
  variant="contained"
  color="primary"
  onClick={() => {
    navigate('/usermanagement');

  }}
>
  User Management
</Button>

        )}

        <Button variant="contained" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      
      {/* Permissions Matrix Table */}
      {/* <Container sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Role-Based Functional Access</Typography>
        <TableContainer component={Paper} sx={{ border: '2px solid #1976d2' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Functionality</strong></TableCell>
                {roles.map((role) => (
                  <TableCell key={role} align="center"><strong>{role}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(permissionMatrix).map(([functionality, permissions]) => (
                <TableRow key={functionality}>
                  <TableCell>{functionality}</TableCell>
                  {permissions.map((perm, idx) => (
                    <TableCell key={`${functionality}-${roles[idx]}`} align="center">{perm}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container> */}
    </Box>
    
  );
};

export default UserProfile;