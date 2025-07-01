import React, { useState } from 'react';
import {
  Avatar, Button, CssBaseline, TextField, Box, Typography, Container, Link
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

const theme = createTheme();

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token'); // or wherever you store it
      await axios.post('/user/reset-password', {
        email,
        new_password: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setResetSuccess(true);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Password reset failed. Please check your email and try again.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockResetIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Reset Password
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errorMessage && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {errorMessage}
              </Typography>
            )}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Reset Password
            </Button>
          </Box>
          {resetSuccess && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Password reset successful! You can now log in with your new password.
              </Typography>
              <Link href="/login" variant="body2">
                Go to Login
              </Link>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}
