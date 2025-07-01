import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Swal from 'sweetalert2';
import { useFormik } from 'formik';
import * as yup from 'yup';
import qs from 'qs';
import { axiosAuthInstance } from '../services/axiosConfig';

const validationSchema = yup.object({
  username: yup.string().required('Username is required'),
  firstname: yup.string().required('First Name is required'),
  lastname: yup.string().required('Last Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  location: yup.string().required('Location is required'),
  organisation: yup.string().required('Organisation Name is required'),
  designation: yup.string().required('Designation is required'),
  contact: yup.string().required('Contact is required'),
  vendor_website: yup.string().required('User Website Name is required'),
  user_type: yup
    .number()
    .oneOf([1, 2, 3], 'User type must be 1 (Admin), 2 (Vendor), or 3 (Vendor-Operator)')
    .required('User type is required')
});

export default function CreateUser() {
  const navigate = useNavigate();

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
      user_type: ''
    },
    validationSchema,
    onSubmit: (values) => {
      console.log('Form values:', values);

      axiosAuthInstance.post(
        '/onboard/create-vendor',
        qs.stringify(values), // convert JSON to x-www-form-urlencoded format
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      )
      .then((response) => {
        if (response.status === 200) {
          Swal.fire('Successful', 'User created successfully', 'success');
          navigate('/profile');
        }
      })
      .catch((error) => {
        console.error('Error response:', error.response);
        if (error.response?.status === 403) {
          Swal.fire('Error', 'Not authorized to create user', 'error');
          navigate('/profile');
        } else {
          Swal.fire('Error', 'Failed to create user', 'error');
        }
      });  }
  });

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
              onChange={formik.handleChange}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
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
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
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
              onChange={formik.handleChange}
              error={formik.touched.contact && Boolean(formik.errors.contact)}
              helperText={formik.touched.contact && formik.errors.contact}
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
              <InputLabel id="user-type-label">User Type</InputLabel>
              <Select
                labelId="user-type-label"
                id="user_type"
                name="user_type"
                value={formik.values.user_type}
                onChange={formik.handleChange}
                error={formik.touched.user_type && Boolean(formik.errors.user_type)}
                label="User Type"
              >
                {/* <MenuItem value={1}>Admin</MenuItem> */}
                <MenuItem value={2}>Vendor</MenuItem>
                {/* <MenuItem value={3}>Vendor-Operator</MenuItem> */}
              </Select>
              {formik.touched.user_type && formik.errors.user_type && (
                <FormHelperText error>{formik.errors.user_type}</FormHelperText>
              )}
            </FormControl>

            <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
              Submit Details
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}
