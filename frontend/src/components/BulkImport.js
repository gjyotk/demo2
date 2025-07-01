import { useContext, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid } from '@mui/material';
import { DataContext } from '../contexts/DataContext';
import AddAdvanced from './AddAdvanced';
import BulkForm from './BulkForm';

function BulkImport() {
  const { fetchAllVerticals, fetchedVerticals } = useContext(DataContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!fetchedVerticals) fetchAllVerticals();
  }, []);

  return (
    <Box sx={{ width: '100%', marginTop: '30px' }}>
      {/* Back button */}
      {location.pathname !== '/add' && (
        <Box sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
            <ArrowBackIcon />
          </IconButton>
        </Box>
      )}
      {/* Forms */}
      <Grid container spacing={2} sx={{ mt: 2, mb: 1, py: 1 }}>
        <Grid item xs={12}>
          <AddAdvanced />
        </Grid>
        <Grid item xs={12}>
          <BulkForm />
        </Grid>
      </Grid>
    </Box>
  );
}

export default BulkImport;
