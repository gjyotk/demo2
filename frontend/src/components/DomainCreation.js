import React, { useContext, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, FormHelperText, Typography,Link } from '@mui/material';
import Swal from 'sweetalert2';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { axiosAuthInstance } from '../services/axiosConfig';
import { DataContext } from '../contexts/DataContext';

const validationSchema = yup.object({
  file: yup
    .mixed()
    .test('fileRequired', 'File is required', (value) => value != null)
    .test('fileSize', 'File is too large', (value) => !value || value.size <= 5 * 1024 * 1024)
    .test('fileType', 'only .json files are allowed', (value) => !value || ['application/json'].includes(value.type))
});

export default function DomainCreation() {
  const { fetchUser, user } = useContext(DataContext);
//   const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    if (user) {
      console.log('Fetched user in Vertical.js:', user);
    }
  }, []);

  const expectedTemplate = [
  {
    res_name: "string",
    res_short_name: "string",
    description: "string",
    pdescription: ["string"],
    name: ["string"],
    data_types: ["string"],
    accuracy: ["string"],
    units: ["string"],
    resolution: ["string"]
  }
];
const validateStructure = (jsonData) => {
  const isArray = Array.isArray(jsonData);
  if (!isArray || jsonData.length !== 1) return { valid: false, message: 'Root must be an array with exactly one object.' };

  const inputKeys = Object.keys(jsonData[0]).sort();
  const expectedKeys = Object.keys(expectedTemplate[0]).sort();

  const missingKeys = expectedKeys.filter(k => !inputKeys.includes(k));
  const extraKeys = inputKeys.filter(k => !expectedKeys.includes(k));

  if (missingKeys.length || extraKeys.length) {
    return {
      valid: false,
      message: `Structure mismatch. Missing keys: [${missingKeys.join(', ')}], Extra keys: [${extraKeys.join(', ')}]`
    };
  }

  // Check if res_short_name is exactly 2 digits
  const shortName = jsonData[0].res_short_name;
  console.log('shortName:', shortName);
if (!/^[a-zA-Z]{2}$/.test(shortName)) {
  return {
    valid: false,
    message: 'res_short_name must be exactly 2 letters'
  };
}


  return { valid: true };
};


  const formik = useFormik({
    initialValues: {
      file: null
    },
    validationSchema,
    onSubmit: (values) => {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const jsonData = JSON.parse(event.target.result);
      const { valid, message } = validateStructure(jsonData);

      if (!valid) {
        Swal.fire('Invalid JSON Structure', message, 'error').then(() => {
  window.location.reload();
});

        return;
      }

      const formData = new FormData();
      formData.append('file', values.file);

      const vendorId = user?.user_id;

      axiosAuthInstance
        .post(`/onboard/store-temp-verticals/${vendorId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
          if (response.status === 200) {
            Swal.fire({
              icon: 'success',
              title: 'Successful',
              text: 'Details submitted successfully',
              showConfirmButton: false,
              timer: 1500,
              position: 'center'
            });
            window.location.reload(true);
          }
        })
        .catch((error) => {
          console.error('Error response:', error.response);
          Swal.fire('Error', 'Failed to create user', 'error').then(() => {
  window.location.reload();
});;
        });
    } catch (err) {
      Swal.fire('Invalid JSON', 'Could not parse the uploaded file as valid JSON.', 'error').then(() => {
  window.location.reload();
});;
    }
  };

  reader.readAsText(values.file);
}

  });

  return (
    <>
      <Box sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px dashed #b0bec5',
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >

<Typography variant="body1" sx={{ fontWeight: 500 }}>
  Please upload a <span style={{ fontWeight: 'bold', color: '#1976d2' }}>.json</span> file containing all the domain details.  
  Template file can be downloaded{' '}
  <Link 
    href="/verticals.json" 
    download 
    sx={{ fontWeight: 'bold', color: '#1976d2' }} 
    underline="hover"
  >
    here
  </Link>.
</Typography>
        </Box>
      </Box>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: -5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
            <input
              id="file"
              name="file"
              type="file"
              onChange={(event) => {
                formik.setFieldValue('file', event.currentTarget.files[0]);
              }}
              accept=".json"
              style={{ marginTop: '16px' }}
            />
            {formik.touched.file && formik.errors.file && (
              <FormHelperText error>{formik.errors.file}</FormHelperText>
            )}

            <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
              Submit
            </Button>
          </Box>
        </Box>
       
      </Container>
       <Container maxWidth="md" sx={{ mt: 2 }}>
  {/* <Typography variant="h6" sx={{alignItems:'center',justifyContent:'center',display:'flex'}} gutterBottom>
    Domain JSON Template Structure
  </Typography> */}
  <Box sx={{ overflowX: 'auto' }}>
    <table style={{ width: '100%',  minWidth: '800px',borderCollapse: 'collapse', border: '1px solid #ccc' }}>
      <thead style={{ backgroundColor: '#f0f0f0' }}>
        <tr>
          <th style={{ border: '1px solid #ccc', padding: '8px' }}>Field</th>
          <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>res_name</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>Domain name</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>res_short_name</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>Domain short name (2 letters only)</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>description</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>Domain description</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>pdescription</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>List of parameter/sensor descriptions</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>name</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>List of parameter/sensor names</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>data_types</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>List of data types</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>accuracy</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>List of accuracy values (or &quot;null&quot;)</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>units</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>List of units (or &quot;null&quot;)</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>resolution</td>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>List of resolution values (or &quot;null&quot;)</td>
        </tr>
      </tbody>
    </table>
  </Box>
</Container>

    </>
  );
}
