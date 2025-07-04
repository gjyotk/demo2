import { useContext } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
// import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';

// auth Service
import { AuthContext } from '../contexts/AuthContext';

const defaultTheme = createTheme();
export default function SignIn() {

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      login(data.get('email'), data.get('password'));
      navigate('/');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('err');
    }
    // If there was a previous location, redirect the user to that location
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Sign In
            </Button>
            <Box display="flex" justifyContent="flex-end" mt={2}>
            <Link component={RouterLink} to="/resetpassword" variant="body2">
              Forgot password?
            </Link>
          </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
              <Tooltip title="Ask admin for creating the account" arrow>
                <IconButton>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <Typography
      variant="body2"
      onClick={() => navigate('/aboutus')}
      style={{ cursor: 'pointer' }}
    >
      Don&apos;t have an account?
    </Typography>
            </Box>
            
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
