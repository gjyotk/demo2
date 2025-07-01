import React from 'react';
import { Typography, Container } from '@mui/material';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
// import BarChartIcon from '@mui/icons-material/BarChart';

// import Add from './components/Add';
import { useNavigate } from 'react-router-dom';

// import { APP_NAME } from '../constants';

function Home() {
  const navigate = useNavigate();
  const handleVerticalClick = () => {
    navigate(`/add`);
  };

  return (
    <Box sx={{ m: 1 }}>

      <Container maxWidth="sm">
        <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
          City name
        </Typography>
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        style={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleVerticalClick}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
export default Home;
