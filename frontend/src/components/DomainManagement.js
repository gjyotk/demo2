import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import RingLoader from 'react-spinners/RingLoader'; // Import the loading spinner
import { useNavigate } from 'react-router-dom';
import ReactJson from 'react-json-view';
import Swal from 'sweetalert2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

import { axiosAuthInstance } from '../services/axiosConfig';

export default function DomainManagement() {
  const [vendors, setVendors] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tempVerticalsData, setTempVerticalsData] = useState([]);
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [currentJson, setCurrentJson] = useState(null);
  const [currentVendorIndex, setCurrentVendorIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { fetchedUser, fetchedUsers, fetchUserDetails, fetchUsers } =
    useContext(AuthContext);

  useEffect(() => {
    if (!fetchedUser) fetchUserDetails();
    if (!fetchedUsers && fetchedUser) fetchUsers();
  });



  useEffect(() => {
    // Fetch data on component mount
    axiosAuthInstance
      .get('/onboard/get-all-temp-verticals')
      .then((response) => {
        console.log('Response Data:', response.data);  // Log the response to check the structure
        // Extract and store temp_verticals directly in state
        const extractedVerticals = response.data.all_temp_verticals.map(item => item.temp_verticals);
        console.log('Extracted Temp Verticals:', extractedVerticals);  // Log verticals data
        setTempVerticalsData(extractedVerticals);  // Save it in state for later use
        setVendors(response.data.all_temp_verticals.map(item => item.vendor_details)); // Also store vendors data
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching pending vendors:', error);
        setLoading(false);
      });
  }, []);


  const handleViewDetails = (vendor) => {
    const index = vendors.findIndex(v => v.email === vendor.email);
    if (index !== -1 && tempVerticalsData[index]) {
      setCurrentVendorIndex(index);
      setCurrentJson(tempVerticalsData[index]);
      setJsonEditorOpen(true);
    } else {
      Swal.fire({
        title: 'Vendor not found',
        text: 'Could not find vertical data for this vendor.',
        icon: 'error',
        confirmButtonText: 'Close'
      });
    }
  };




  // const saveDataAsJson = (data) => {
  //   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  //   const url = URL.createObjectURL(blob);

  //   // Create an anchor element to trigger download
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'tempVerticalsData.json';
  //   a.click();

  //   // Revoke the object URL
  //   URL.revokeObjectURL(url);
  // };

  const handleApprove = async (id) => {
    setIsLoading(true); // Set loading to true before the API call

    try {
      // Flatten the data in case tempVerticalsData is a nested array
      const flattenedData = tempVerticalsData.flat(); // This will flatten one level of arrays

      const response = await axiosAuthInstance.post(
        `/onboard/verticals/bulk-create/${encodeURIComponent(id)}`,
        flattenedData,  // Now we send the flattened list directly
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Approval successful:', response.data);

      Swal.fire({
        icon: 'success',
        title: 'Domain Created',
        text: `Successfully approved`,
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // window.location.reload();
      });

      setVendors(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      console.error('Approval failed:', error?.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text: JSON.stringify(error?.response?.data?.detail || error.message),
      });
    } finally {
      setIsLoading(false); // Hide the loading spinner after the API call finishes
    }
  };


  const handleSaveAndApprove = (id) => {
    // Save the data as a JSON file
    // saveDataAsJson(tempVerticalsData);

    // Proceed with the approval
    handleApprove(id);
  };


  const handleReject = (id) => {
    Swal.fire({
      title: 'Reject Vendor',
      text: `Please provide a reason for rejecting the vendor: ${id}`,
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

        // Start loading before the API request
        setIsLoading(true);

        // Now send the POST request with the remarks
        axiosAuthInstance
          .post(`/onboard/verticals/reject/${encodeURIComponent(id)}`, { remarks })
          .then((response) => {
            console.log('Rejection successful:', response.data);

            Swal.fire({
              icon: 'success',
              title: 'Vendor Rejected',
              text: `Successfully rejected ${id}`,
              timer: 1500,
              showConfirmButton: false,
            });
            window.location.reload();
            // Optionally, remove the rejected vendor from the list
            setVendors((prev) => prev.filter((v) => v.id !== id));
          })
          .catch((error) => {
            console.error('Rejection failed:', error);

            Swal.fire({
              icon: 'error',
              title: 'Rejection Failed',
              text: `Could not reject ${id}`,
            });
          })
          .finally(() => {
            setIsLoading(false); // Hide loading spinner after the request completes
          });
      }
    });
  };



  return (
    <Box sx={{ mt: 4, width: '100%', px: 2 }}>
      <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h5" gutterBottom>
        Domain Requests
      </Typography>
      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}



      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: 700, 
            overflow: 'auto',
            '& .MuiTable-root': {
              // Make table more compact on smaller screens
              '@media (max-width: 960px)': {
                '& .MuiTableCell-root': {
                  padding: '8px 4px',
                  fontSize: '0.75rem',
                }
              },
              '@media (max-width: 600px)': {
                '& .MuiTableCell-root': {
                  padding: '6px 2px',
                  fontSize: '0.7rem',
                }
              }
            }
          }}
        >
          <Table size="small"> {/* Use small size for more compact layout */}
            <TableHead>
              <TableRow>
                {/* <TableCell sx={{
        position: 'sticky',
        top: 0,
        fontWeight: 'bold',
        backgroundColor: 'background.paper',
        zIndex: 1,
      }}>Username</TableCell> */}
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>First Name</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Last Name</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Organisation</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Designation</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Contact</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Email</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Vendor Website</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Location</TableCell>



                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }}>Domain File</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  top: 0,
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  fontSize: {
                    xs: '0.7rem',    // extra-small devices
                    sm: '0.75rem',   // small devices
                    md: '0.875rem'   // medium and up
                  }
                }} align="center">Approval</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.firstname}</TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.lastname}</TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.organisation}</TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.designation}</TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.contact}</TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.email}</TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.vendor_website}</TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 100, sm: 200, md: 400 },
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: {
                      xs: '0.7rem',
                      sm: '0.75rem',
                      md: '0.875rem'
                    }
                  }}>{vendor.location}</TableCell>


                  <TableCell>
                    <IconButton color="secondary" onClick={() => handleViewDetails(vendor)}>
                      <span style={{ fontSize: '1rem' }}>View File</span>
                    </IconButton>

                  </TableCell>

                  <Dialog open={jsonEditorOpen} onClose={() => setJsonEditorOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Edit Temp Verticals JSON</DialogTitle>
                    <DialogContent dividers>
                      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        <ReactJson
                          src={currentJson}
                          onEdit={e => setCurrentJson(e.updated_src)}
                          onAdd={e => setCurrentJson(e.updated_src)}
                          onDelete={e => setCurrentJson(e.updated_src)}
                          enableClipboard={false}
                          displayDataTypes={false}
                          collapsed={false}
                          name={false}
                          style={{ fontSize: '14px' }}
                        />
                      </Box>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setJsonEditorOpen(false)} color="secondary">Cancel</Button>
                      <Button
                        onClick={() => {
                          const updatedData = [...tempVerticalsData];
                          updatedData[currentVendorIndex] = currentJson;
                          setTempVerticalsData(updatedData);
                          setJsonEditorOpen(false);
                          // Swal.fire('Saved', 'Temp Verticals updated successfully.', 'success');
                        }}
                        color="primary"
                        variant="contained"
                      >
                        Save
                      </Button>
                    </DialogActions>
                  </Dialog>

                  <TableCell align="center">
                    <IconButton color="success" onClick={() => handleSaveAndApprove(vendor.id)}>
                      <CheckCircle sx={{ color: 'grey' }} />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleReject(vendor.id)}>
                      <Cancel sx={{ color: 'lightgrey' }} />
                    </IconButton>

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>

      )}

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <RingLoader color="#123462" loading={isLoading} size={50} />
        </div>
      )}
      {!loading && vendors.length === 0 && (
        <Typography variant="h6" color="textSecondary" align="center">
          Domain requests not available
        </Typography>
      )}

    </Box>
  );
}
