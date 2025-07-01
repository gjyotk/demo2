import { useEffect, useState, useContext } from 'react';
import { RingLoader } from 'react-spinners';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Swal from 'sweetalert2';
import { axiosAuthInstance, BACKEND_API_URL } from '../services/axiosConfig';
import CodeComponent from './CodeComponent';
import { DataContext } from '../contexts/DataContext';

function CenteredLoading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <RingLoader color="#123462" loading />
    </Box>
  );
}
export default function Details() {
  const [selectedData, setSelectedData] = useState(null);
  const [nodeId, setNodeId] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [vendorAssigned, setVendorAssigned] = useState(false);
  const [showCodeComponent, setShowCodeComponent] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [subscribedUrls, setSubscribedUrls] = useState([]);
  const [notificationType, setNotificationType] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showSubscribedUrls, setShowSubscribedUrls] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  const [locationData, setLocationData] = useState(null);

  // Sample JSON data for demonstration
  const sampleData = (params) => `{
  "m2m:sgn": {
    "m2m:nev": {
      "m2m:rep": {
        "m2m:cin": {
          "rn": "<node_name>",
          "ty": 4,
          "ri": "<resource_id>",
          "pi": "<parent_id>",
          "ct": "<creation_time>",
          "lt": "<last_modified_time>",
          "lbl": ["<label>"],
          "st": 0,
          "cnf": "text/plain:0",
          "cs": 6,
          "con": ${JSON.stringify(params)}
        }
      },
      "m2m:rss": 1
    },
    "m2m:sud": false,
    "m2m:sur": "<subscription_id>"
  }
}`;

  const handleShowSampleData = () => {
    setShowSampleData(true);
  };

  const handleCloseSampleData = () => {
    setShowSampleData(false);
  };

  const { user, fetchUser, isUserfetched, USER_TYPES } = useContext(DataContext);

  const toggleSubscribedUrls = () => {
    setShowSubscribedUrls(!showSubscribedUrls);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSubscriptionDialogOpen = () => {
    setSubscriptionDialogOpen(true);
  };

  const handleSubscriptionDialogClose = () => {
    setSubscriptionDialogOpen(false);
    setSubscriptionUrl('');
  };

  const handleSubscribe = () => {
    if (subscribedUrls.includes(subscriptionUrl)) {
      setNotificationType('info');
      setNotificationMessage('Already subscribed to this URL');
      return;
    }

    //  Check if url is http or not (we only support http for now)
    if (!subscriptionUrl.startsWith('http')) {
      setNotificationType('error');
      setNotificationMessage('Only HTTP URLs are supported');
      return;
    }

    const code = selectedData.node_name.slice(0, 2);

    axiosAuthInstance
      .post('/subscription/subscribe', {
        node_id: `AE-${code}/${selectedData.node_name}`,
        url: subscriptionUrl
      })
      .then((response) => {
        if (response.status === 200) {
          setSubscribedUrls([...subscribedUrls, subscriptionUrl]);
          setNotificationType('success');
          setNotificationMessage('Subscription successful');
        }
      })
      .catch((error) => {
        console.error('Error Subscribing: ', error);
        setNotificationType('error');
        if (error.response) setNotificationMessage(error.response.data.detail);
        else setNotificationMessage('Error Subscribing to that url.');
      });

    handleSubscriptionDialogClose();
  };

  const handleSnackbarClose = () => {
    setNotificationType('');
    setNotificationMessage('');
  };

  const sortedData = selectedData
    ? [...selectedData.cins].sort((a, b) => {
      const dateA = new Date(
        a[1].replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z')
      );
      const dateB = new Date(
        b[1].replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z')
      );
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    })
    : [];

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');

    if (!isUserfetched) fetchUser();

    axiosAuthInstance
      .get(`/nodes/get-node-data/${filter}`)
      .then((response) => {
        const selectedItem = response.data.detail;
        console.log('Selected Item:', selectedItem);
        if (!selectedItem) {
          Swal.fire({
            icon: 'error',
            title: 'No node with the specified name exists!',
            text: 'Redirecting to homepage',
             timer: 1500,
        showConfirmButton: false,
          }).then(() => {
            setTimeout(() => {
              navigate('/');
            }, 2000);
          });
        }
        setSelectedData(selectedItem);
        setNodeId(true);

        // Fetch location data
        axiosAuthInstance
          .get(`/nodes/meta/id/${selectedItem.node_name}`)
          .then((locationResponse) => {
            setLocationData(locationResponse.data);
          })
          .catch((error) => {
            console.error('Error fetching location data', error);
          });

        axiosAuthInstance
          .get(`/nodes/get-vendor/${selectedItem.node_name}`)
          .then((res) => {
            setVendorAssigned(res.data);
            console.log(res.data);
          })
          .catch((error) => {
            console.error('Error fetching vendor', error);
            setVendorAssigned(false);
          });
      })
      .catch((error) => {
        console.log(error);
        Swal.fire({
          icon: 'error',
          title: error?.response?.data?.detail,
          text: 'Redirecting to homepage',
           timer: 1500,
        showConfirmButton: false,
        }).then(() => {
          setTimeout(() => {
            navigate('/');
          }, 2000);
        });
      });
  }, [location.search]);

  useEffect(() => {
    if (nodeId === false) return;
    const code = selectedData.node_name.slice(0, 2);

    axiosAuthInstance
      .post('/subscription/get-subscriptions', {
        node_id: `AE-${code}/${selectedData.node_name}`
      })
      .then((response) => {
        if (response.status === 200) {
          const res = response.data.map((sub) => sub.url);
          setSubscribedUrls(res);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [nodeId]);

  useEffect(() => {
    if (isUserfetched) {
      setLoading(false);
      if (user.user_type === 1) {
        setShowCodeComponent(vendorAssigned);
      }
      if (user.user_type === 2) {
      
          setShowCodeComponent(vendorAssigned);
        
      }
      if (user.user_type ===3) {
        setShowCodeComponent(vendorAssigned);
      }
    }
  }, [isUserfetched, vendorAssigned]);

  const adminVendorAssignment = (
    <Grid item xs={12}>
      <Typography variant="h5" gutterBottom>
        {/* {vendorAssigned ? 'Assigned Vendor' : 'Assign Vendor'} */}
      </Typography>
      {vendorAssigned ? (
        <Box>
          <Typography variant="body2" color="text.secondary">
            {/* <strong>Username: </strong> {vendorAssigned.username} */}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {/* <strong>Email: </strong> {vendorAssigned.email} */}
          </Typography>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            const vendorEmail = document.getElementById('vendorEmail').value;
            axiosAuthInstance
              .post(`/nodes/assign-vendor`, {
                vendor_email: vendorEmail,
                node_id: selectedData.node_name
              })
              .then((res) => {
                console.log(res);
                Swal.fire({
                  icon: 'success',
                  title: 'Vendor assigned successfully!',
                   timer: 1500,
        showConfirmButton: false,
                }).then(() => {
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                });
              })
              .catch((error) => {
                console.error('Error assigning vendor', error);
                Swal.fire({
                  icon: 'error',
                  title: error.response.data.detail || 'Error assigning vendor',
                  timer: 2000
                });
              });
          }}
          noValidate
          sx={{ mt: 1 }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="vendorEmail"
            label="Vendor Email"
            name="vendorEmail"
            autoComplete="email"
            autoFocus
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Assign Vendor
          </Button>
        </Box>
      )}
    </Grid>
  );

  const vendorVendorAssignment = (
    <Grid item xs={12}>
      {/* <Typography variant="h5" gutterBottom>
        Assigned Vendor
      </Typography> */}
      {vendorAssigned ? (
        <Typography variant="body2" color="text.secondary">
          {/* <strong>Username: </strong> {vendorAssigned.username} <br />
          <strong>Email: </strong> {vendorAssigned.email} */}
        </Typography>
      ) : (
        <Typography gutterBottom>Not Assigned</Typography>
      )}
    </Grid>
  );

  const handleDeleteSubscrpition = (index) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover this subscription: ${subscribedUrls[index]}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      console.log(result);
    });
  };
  useEffect(() => {
    if (selectedData?.node_name && vendorAssigned?.api_token) {
      fetch(`${BACKEND_API_URL}/nodes/get-node-data/${selectedData.node_name}/latest`, {
        headers: {
          Authorization: `Bearer ${vendorAssigned.api_token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          console.log(data);
          // set state to display or process the data
        });
    }
  }, [selectedData, vendorAssigned]);
  

  return loading ? (
    <CenteredLoading />
  ) : (
    <Box sx={{ p: 3, m: 3 }}>
      {selectedData ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography variant="h5" gutterBottom>
                      Device Information
                    </Typography>
                    <Typography variant="body1">
                      <strong>Node Name:</strong> {selectedData.name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Node ID:</strong> {selectedData.node_name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Domain:</strong> {selectedData.vertical_name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Sensor Type:</strong> {selectedData.res_name}
                    </Typography>
                    {locationData && (
                      <Typography
                        variant="body1"
                      >
                        <strong>Coordinates:</strong> {locationData.latitude}, {locationData.longitude}
                      </Typography>
                    )}
                    <Typography variant="body1">
                      <strong>Parameters:</strong>
                      {selectedData.parameters.map((param) => (
                        <Chip key={param} label={param} sx={{ m: 1 }} />
                      ))}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    {user.user_type === USER_TYPES.ADMIN && adminVendorAssignment}
                    {user.user_type === USER_TYPES.VENDOR && vendorVendorAssignment}
                    {user.user_type === USER_TYPES.USER && (
                      <Grid item xs={12}>
                        <Typography variant="h5" gutterBottom>
                          Vendor Assignment
                        </Typography>
                        <Typography variant="body1">
                          <strong>Vendor: </strong>
                          {vendorAssigned ? vendorAssigned.username : 'Not Assigned'}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                  Subscriptions:
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ ml: 2 }}
                    onClick={handleSubscriptionDialogOpen}>
                    Subscribe
                  </Button>
                </Typography>
                <Box display="flex" gap={2}>
                  <Button
                    onClick={toggleSubscribedUrls}
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}>
                    {showSubscribedUrls ? 'Hide Subscribed URLs' : 'Show Subscribed URLs'}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleShowSampleData}
                    sx={{ mt: 2 }}>
                    Show Sample Data
                  </Button>
                </Box>
                {showSubscribedUrls && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Subscribed URLs:
                    </Typography>

                    {subscribedUrls.map((url, index) => (
                      <Box
                        key={url}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="body1">
                          {index + 1}. {url}
                        </Typography>
                        <IconButton onClick={() => handleDeleteSubscrpition(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Dialog to display sample data */}
                <Dialog
                  open={showSampleData}
                  onClose={handleCloseSampleData}
                  fullWidth
                  maxWidth="md">
                  <DialogTitle>Sample JSON Data</DialogTitle>
                  <DialogContent dividers>
                    <Typography variant="body1" component="div">
                      <pre>{sampleData(selectedData.parameters)}</pre>
                    </Typography>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </Grid>
          {/* Code Part */}

          {showCodeComponent && (
  <Grid item xs={12}>
    <CodeComponent
      token={selectedData.token_num}
      nodeParams={selectedData.parameters}
      dataTypes={selectedData.data_types}
      apiToken={vendorAssigned.api_token}
      hideCode={selectedData.cins && selectedData.cins.length > 0} // Pass prop to hide code
    />
  </Grid>
)}


          {/* Fetch the latest data */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Fetch Latest Data
                </Typography>
                <Typography variant="body1">
                  <strong>URL: </strong>
                  <Link
  href={`${BACKEND_API_URL}/proxy/node/${selectedData.node_name}/latest`}
  target="_blank"
  rel="noopener"
  sx={{ color: 'blue' }}
>
  {`${BACKEND_API_URL}/proxy/node/${selectedData.node_name}/latest`}
</Link>

                </Typography>
              </CardContent>
            </Card>
          </Grid>


          {/* Data Collected */}
          <Grid item xs={12}>
            <TableContainer component={Card}>
              <Table aria-label="custom pagination table">
                <TableBody>
                  <TableRow>
                    {selectedData.parameters.map((param) => (
                      <TableCell key={param}>{param}</TableCell>
                    ))}
                    <TableCell onClick={handleSort} style={{ cursor: 'pointer' }}>
                      Timestamp
                      <IconButton size="small">
                        {sortOrder === 'asc' ? (
                          <ArrowUpwardIcon fontSize="inherit" />
                        ) : (
                          <ArrowDownwardIcon fontSize="inherit" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  {sortedData.map((cin) => (
                  <TableRow key={cin.id}> {/* Changed key from `cin[1]` to `cin.id` for consistency */}
                    {Object.entries(cin).map(([key, value]) => (
                      <TableCell
                        key={`${cin.id}-${key}`} // Corrected syntax for template literal
                        sx={{
                          maxWidth: '10ch', // Limits the cell's width
                          overflow: 'hidden', // Hides overflow content
                          textOverflow: 'ellipsis', // Adds ellipsis for overflow
                          whiteSpace: 'nowrap', // Prevents text wrapping
                          '&:hover': {
                            overflow: 'auto', // Adds scrollbar on hover
                            whiteSpace: 'normal', // Allows text wrapping
                          },
                        }}
                      >
                        {value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
        </Grid>
      ) : (
        <CenteredLoading />
      )}

      {/* Subscription Dialog */}
      <Dialog open={subscriptionDialogOpen} onClose={handleSubscriptionDialogClose}>
        <DialogTitle>Subscribe to Updates</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="subscriptionUrl"
            label="Subscription URL"
            type="url"
            fullWidth
            value={subscriptionUrl}
            onChange={(e) => setSubscriptionUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSubscribe}
            color="primary"
            disabled={!subscriptionUrl.trim()} // Disable button if input is empty
            sx={{ color: subscriptionUrl.trim() ? 'primary.dark' : 'grey.500' }} // Set button color based on input
          >
            Subscribe
          </Button>
          <Button
            onClick={handleSubscriptionDialogClose}
            color="primary"
            sx={{ color: 'primary.dark' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!notificationMessage}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={notificationType} sx={{ width: '100%' }}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}