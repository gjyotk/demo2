import React from 'react';
import { Typography, Container, Button } from '@mui/material';

function NotFound() {
  return (
    <Container maxWidth="sm">
      <Typography variant="h1" align="center" color="textPrimary" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" align="center" color="textSecondary" paragraph>
        Oops, the page you&apos;re looking for does not exist.
      </Typography>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" color="primary" href="/">
          Go to Homepage
        </Button>
      </div>
    </Container>
  );
}

export default NotFound;
