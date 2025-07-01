import {useContext,useEffect,useState} from 'react';
import { useNavigate} from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  // FormHelperText,
  FormControl,
  // InputLabel,
  // Select,
  // MenuItem,
  MenuItem,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Swal from 'sweetalert2';
import { useFormik } from 'formik';
import * as yup from 'yup';
import qs from 'qs';
import { useAuth,AuthContext } from '../contexts/AuthContext';
import { axiosAuthInstance } from '../services/axiosConfig';

const validationSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .matches(/^\S*$/, 'Username cannot contain spaces'),
  firstname: yup.string().required('First Name is required'),
  lastname: yup.string().required('Last Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  location: yup.string().required('Location is required'),
  organisation: yup.string().required('Organisation Name is required'),
  designation: yup.string().required('Designation is required'),
  contact: yup
    .string()
    .required('Contact is required')
    .matches(/^\d{10}$/, 'Contact number must be exactly 10 digits'),
  vendor_website: yup.string().required('User Website Name is required'),
  user_type: yup
    .number()
    .oneOf([1, 2, 3], 'User type must be 1 (Admin), 2 (Vendor), or 3 (Vendor-Operator)')
    .required('User type is required'),
  vendor_email: yup
  .string()
  .email('Enter a valid email')
  .when('user_type', {
    is: 3, // vendor-operator
    then: (schema) => schema.required('Vendor Email is required'),
    otherwise: (schema) => schema.notRequired()
  }),

});

export default function CreateUser() {
  const { isLoggedIn } = useAuth(); // Moved inside component
  const navigate = useNavigate();
  const {user,fetchedUser, fetchedUsers,fetchUserDetails, fetchUsers} = useContext(AuthContext);
  // const [ setExistingUsernames] = useState([]);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
const [contactError, setContactError] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

  
  let defaultUserType = 2; // default to Vendor
  if (user) {
    if (user.user_type === 1) {
      defaultUserType = '';
    } else {
      defaultUserType = 3;
    }
  }

  const formik = useFormik({
    initialValues: {
      username: '',
      firstname: '',
      lastname: '',
      email: '',
      location: '',
      organisation: '',
      designation: '',
      contact: '',
      vendor_website: '',
      user_type: defaultUserType,
      vendor_email: '' // <-- New field
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        // Continue with existing submit logic...
        if (isLoggedIn) {
  // First: create the vendor
  const createResponse = await axiosAuthInstance.post(
    '/onboard/create-vendor',
    qs.stringify(values),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  // If successful, then approve
  if (createResponse.status === 200) {
    const approveResponse = await axiosAuthInstance.post(
      `/onboard/approve-vendor?email=${encodeURIComponent(values.email)}`,
      qs.stringify(values),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (approveResponse.status === 200) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'User created and approved successfully',
        showConfirmButton: false,
        timer: 1500,
        position: 'center'
      });
      window.location.reload(true);
    }
  }
}
 else {
          // If not logged in, only create vendor
          const response = await axiosAuthInstance.post(
            '/onboard/create-vendor',
            qs.stringify(values),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
          );

          if (response.status === 200) {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Details submitted successfully',
              showConfirmButton: false,
              timer: 1500,
              position: 'center'
            });
            window.location.reload(true);
          }
        }
      } catch (error) {
        console.error('Error response:', error.response);
        if (error.response?.status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Not authorized to create user',
            showConfirmButton: false,
            timer: 1500,
            position: 'center'
          });
          navigate('/profile');
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.detail || 'An error occurred',
            showConfirmButton: false,
            timer: 1500,
            position: 'center'
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  useEffect(() => {
    if (user && !fetchedUser) fetchUserDetails();
    if (user && fetchedUser && !fetchedUsers) fetchUsers();
  }, [user, fetchedUser, fetchedUsers, fetchUserDetails, fetchUsers]);

  const handleEmailBlur = (e) => {
    formik.handleBlur(e);
  };

  const handleContactBlur = (e) => {
    formik.handleBlur(e);
  };

  const handleEmailChange = (e) => {
    const { value } = e.target;
    formik.handleChange(e);
    if (!value) setEmailError('');
  };

  const handleContactChange = (e) => {
    const { value } = e.target;
    // Only allow digits
    const sanitizedValue = value.replace(/\D/g, '');
    // Update form with sanitized value
    e.target.value = sanitizedValue;
    formik.handleChange(e);
    
    if (!value) {
      setContactError('');
    }
  };

  const handleUsernameChange = (e) => {
    const { value: newUsername } = e.target;
    
    // Remove spaces from input
    const sanitizedValue = newUsername.replace(/\s/g, '');
    e.target.value = sanitizedValue;
    
    formik.handleChange(e);
    if (!sanitizedValue) {
      setUsernameError('');
    }
  };

  const handleUsernameBlur = (e) => {
    formik.handleBlur(e);
  };

  return (
    <>
      <Box sx={{ p: 2, mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <Container component="main" maxWidth="xs">
        <Box sx={{ marginTop: -5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                required
                fullWidth
                id="firstname"
                label="First Name"
                name="firstname"
                value={formik.values.firstname}
                onChange={formik.handleChange}
                error={formik.touched.firstname && Boolean(formik.errors.firstname)}
                helperText={formik.touched.firstname && formik.errors.firstname}
              />
              <TextField
                required
                fullWidth
                id="lastname"
                label="Last Name"
                name="lastname"
                value={formik.values.lastname}
                onChange={formik.handleChange}
                error={formik.touched.lastname && Boolean(formik.errors.lastname)}
                helperText={formik.touched.lastname && formik.errors.lastname}
              />
            </Box>
  <TextField
    margin="normal"
    required
    fullWidth
    id="username"
    label="Username"
    name="username"
    value={formik.values.username}
    onChange={handleUsernameChange}  // Use the updated handleChange function
    onBlur={handleUsernameBlur}  // Use the updated handleBlur function
    error={Boolean(formik.touched.username && (formik.errors.username || usernameError))}
    helperText={formik.touched.username && (formik.errors.username || usernameError)}
  />
<TextField
  margin="normal"
  required
  fullWidth
  name="email"
  label="Organisation/Official Email Address"
  type="email"
  id="email"
  value={formik.values.email}
  onChange={handleEmailChange}
  onBlur={handleEmailBlur}
  error={Boolean(formik.touched.email && (formik.errors.email || emailError))}
  helperText={formik.touched.email && (formik.errors.email || emailError)}
/>
            <TextField
              margin="normal"
              required
              fullWidth
              name="location"
              label="Location"
              type="text"
              id="location"
              value={formik.values.location}
              onChange={formik.handleChange}
              error={formik.touched.location && Boolean(formik.errors.location)}
              helperText={formik.touched.location && formik.errors.location}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="organisation"
              label="Organisation Name"
              type="text"
              id="organisation"
              value={formik.values.organisation}
              onChange={formik.handleChange}
              error={formik.touched.organisation && Boolean(formik.errors.organisation)}
              helperText={formik.touched.organisation && formik.errors.organisation}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="designation"
              label="Designation"
              type="text"
              id="designation"
              value={formik.values.designation}
              onChange={formik.handleChange}
              error={formik.touched.designation && Boolean(formik.errors.designation)}
              helperText={formik.touched.designation && formik.errors.designation}
            />
<TextField
  margin="normal"
  required
  fullWidth
  name="contact"
  label="Contact"
  type="text"
  id="contact"
  value={formik.values.contact}
  onChange={handleContactChange}
  onBlur={handleContactBlur}
  error={Boolean(formik.touched.contact && (formik.errors.contact || contactError))}
  helperText={formik.touched.contact && (formik.errors.contact || contactError)}
/>
            <TextField
              margin="normal"
              required
              fullWidth
              name="vendor_website"
              label="User Website"
              type="text"
              id="vendor_website"
              value={formik.values.vendor_website}
              onChange={formik.handleChange}
              error={formik.touched.vendor_website && Boolean(formik.errors.vendor_website)}
              helperText={formik.touched.vendor_website && formik.errors.vendor_website}
            />
<FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
  {(!user) && (
    <TextField
    select
    label="User Type"
    name="user_type"
    value={formik.values.user_type}
    onChange={formik.handleChange}
  >
    <MenuItem value={2}>Vendor</MenuItem>
    <MenuItem value={3}>Vendor-Operator</MenuItem>
  </TextField>
  )}

  {(user && user.user_type === 1) && (
    <TextField
      select
      label="User Type"
      name="user_type"
      value={formik.values.user_type}
      onChange={formik.handleChange}
    >
      {/* <MenuItem value={1}>Admin</MenuItem> */}
      <MenuItem value={2}>Vendor</MenuItem>
      <MenuItem value={3}>Vendor-Operator</MenuItem>
    </TextField>
  )}

  {(user && user.user_type === 2) && (
    <TextField
      label="User Type"
      value="Vendor-Operator"
      name="user_type"
      disabled
    />
  )}

{formik.values.user_type === 3 && (
  <TextField
    margin="normal"
    fullWidth
    id="vendor_email"
    name="vendor_email"
    label="Vendor Email"
    value={formik.values.vendor_email}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    error={formik.touched.vendor_email && Boolean(formik.errors.vendor_email)}
    helperText={formik.touched.vendor_email && formik.errors.vendor_email}
    required
  />
)}

</FormControl>


            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              color="primary" 
              disabled={isSubmitting}
              sx={{ 
                mt: 3, 
                mb: 2,
                height: 48  // Fixed height to prevent button size change
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Submit Details'
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}
