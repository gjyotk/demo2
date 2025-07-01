import Popover from '@mui/material/Popover';
import InfoIcon from '@mui/icons-material/Info';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Menu, MenuItem, Stack, Paper, Grid, Badge } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useState, useContext, useEffect } from 'react';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../contexts/DataContext';
import { axiosAuthInstance } from '../services/axiosConfig';
import IIITHLogo from '../assets/images/iiithlogo_white.png';
import SCRCLogo from '../assets/images/scrclogo.png';
import MainListItems from './listItems';
import { useAuth, AuthContext } from '../contexts/AuthContext';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open'
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'fixed',
      height: '100vh',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      }),
      boxSizing: 'border-box',
      overflowY: 'auto',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9)
        }
      })
    }
  })
);

export default function TopBar({ children }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const [alarmAnchorEl, setAlarmAnchorEl] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const handleCloseAlarm = (id) => {
    setAlarmAnchorEl(null);
    Swal.fire({
      title: 'Remarks',
      input: 'text',
      inputPlaceholder: 'Enter your remarks',
      showCancelButton: true,
      confirmButtonText: 'Submit'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const remarks = result.value;
        axiosAuthInstance.put(`/alarms/${id}/mark-read`, { remarks })
          .then(() => {
            setAlarms((prev) => prev.filter((alarm) => alarm.id !== id));
            Swal.fire({
              icon: 'success',
              title: 'Alarm Closed',
              text: `Alarm ${id} marked as read.`,
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'center-end'
            });
          })
          .catch((err) => {
            console.error('Error marking alarm as read:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: 'Could not close alarm.',
              timer: 1500,
              showConfirmButton: false,
              position: 'center-end'
            });
          });
      }
    });
  };

  const handleCloseNotif = (id) => {
    axiosAuthInstance.put(`/alarms/${id}/mark-read`, {
      remarks: 'Auto-closed by user'
    })
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      })
      .catch((err) => {
        console.error('Error marking notification as read:', err);
      });
  };

  const { logout, setUser } = useContext(AuthContext);
  const { setIsUserFetched } = useContext(DataContext);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      axiosAuthInstance.get('/alarms/alarms')
        .then(response => {
          const activeAlarms = response.data.filter(alarm => !alarm.status);
          setAlarms(activeAlarms);
        })
        .catch(err => console.error('Error fetching alarms:', err));

      axiosAuthInstance.get('/alarms/notifications')
        .then((response) => {
          if (response.status === 200 && Array.isArray(response.data)) {
            const unreadNotifications = response.data.filter(n => n.status === null);
            setNotifications(unreadNotifications);
          }
        })
        .catch((err) => {
          console.error('Error fetching notifications:', err);
        });
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsUserFetched(false);
    navigate('/');
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleInfoClick = () => {
    setAlarmAnchorEl(null);
    navigate('/alarms');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        open={open}
        sx={{
          backgroundColor: '#123462',
          color: '#ffffff',
          boxShadow: 'none'
        }}>
        <Toolbar sx={{ pr: '24px', display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' })
            }}>
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexDirection: { xs: 'column', sm: 'row' },
              mr: 2
            }}
          >
            <img
              src={IIITHLogo}
              alt="IIIT"
              style={{ width: '60px', objectFit: 'contain' }}
            />
            <img
              src={SCRCLogo}
              alt="SCRC"
              style={{ width: '60px', objectFit: 'contain' }}
            />
          </Box>
          <Typography
            component="h1"
            variant="h6"
            color="#ffffff"
            noWrap={false}
            sx={{
              flexGrow: 1,
              textAlign: { xs: 'center', md: 'center' },
              fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' },
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              paddingRight: { xs: 0, md: '100px' },
              maxWidth: { xs: '180px', sm: 'none' }
            }}
          >
            City IoT Operating Platform (ctOP)
          </Typography>

          {isLoggedIn ? (
            <div>
              <IconButton
                sx={{ color: '#ffffff', '&:hover': { color: '#b4bce3' } }}
                onClick={(event) => {
                  setAlarmAnchorEl(event.currentTarget);
                  axiosAuthInstance.get('/alarms')
                    .then((response) => {
                      console.log('Alarms data:', response.data);
                      setAlarms(response.data);
                    })
                    .catch((err) => console.error('Error fetching alarms:', err));
                }}
              >
                <Badge
                  badgeContent={alarms.length}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ff0000',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  <AccessAlarmIcon />
                </Badge>
              </IconButton>

              <IconButton
                sx={{ color: '#ffffff', '&:hover': { color: '#b4bce3' } }}
                onClick={(event) => {
                  setNotifAnchorEl(event.currentTarget);
                  axiosAuthInstance.get('/alarms/notifications')
                    .then((response) => {
                      if (response.status === 200 && Array.isArray(response.data)) {
                        const unreadNotifications = response.data.filter(n => n.status === null);
                        setNotifications(unreadNotifications);
                      }
                    })
                    .catch((err) => {
                      console.error('Error fetching notifications:', err);
                    });
                }}
              >
                <Badge
                  badgeContent={notifications.length}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ff0000',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <IconButton
                sx={{ color: '#ffffff', '&:hover': { color: '#b4bce3' } }}
                onClick={handleMenuClick}
              >
                <AccountCircle />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
              >
                <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          ) : (
            <Button onClick={() => navigate('/login')} color="inherit">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        open={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <Toolbar sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
          minHeight: '64px !important'
        }}>
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          <MainListItems />
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          ml: open ? `${drawerWidth}px` : '56px',
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          pt: '64px',
          px: 3,
          backgroundColor: '#eceef8'
        }}
      >
        {children}
      </Box>

      <Popover
        open={Boolean(alarmAnchorEl)}
        anchorEl={alarmAnchorEl}
        onClose={() => setAlarmAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 300, maxWidth: 400, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Alarms</Typography>
            <IconButton size="small" onClick={handleInfoClick} sx={{ ml: 1 }}>
              <InfoIcon />
            </IconButton>
          </Box>
          {alarms.length === 0 ? (
            <Typography variant="body2">No active alarms</Typography>
          ) : (
            <Stack spacing={2}>
              {alarms.map((alarm) => (
                <Paper
                  key={alarm.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    position: 'relative',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleCloseAlarm(alarm.id)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      backgroundColor: '#e53935',
                      color: '#fff',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: '#d32f2f' }
                    }}
                  >
                    Close
                  </IconButton>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Action:</strong> {alarm.parameter}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Details:</strong>{alarm.value}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {new Date(alarm.created_at).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>

      <Popover
        open={Boolean(notifAnchorEl)}
        anchorEl={notifAnchorEl}
        onClose={() => setNotifAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 300, maxWidth: 400, maxHeight: 500, overflow: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Notifications</Typography>
          {notifications.length === 0 ? (
            <Typography variant="body2">No new notifications</Typography>
          ) : (
            <Stack spacing={2}>
              {notifications.map((notif) => (
                <Paper
                  key={notif.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    position: 'relative',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleCloseNotif(notif.id)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      bottom: 8,
                      backgroundColor: '#FFA500',
                      color: '#fff',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: '#d32f2f' }
                    }}
                  >
                    Mark as Read
                  </IconButton>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Action: </strong>{notif.parameter}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Details:</strong> {notif.value}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {new Date(notif.created_at).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>
    </Box>
  );
}