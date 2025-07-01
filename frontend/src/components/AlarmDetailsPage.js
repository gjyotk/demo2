import React, { useState, useEffect } from 'react';
import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { axiosAuthInstance } from '../services/axiosConfig';

const AlarmDetailsPage = () => {
  const [allAlarms, setAllAlarms] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    axiosAuthInstance.get(`/alarms/alarms`)
      .then((response) => {
        setAllAlarms(response.data);
      })
      .catch((err) => {
        console.error('Error fetching alarm details:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch alarm details.',
          timer: 1500,
          position: 'center',
        });
      });
  }, []);

  return (
    <Box sx={{ padding: 4 }}>
            {/* Go Back button */}
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
          <ArrowBackIcon />
        </IconButton>
      <Typography variant="h5" sx={{ mb: 2 }}>Alarm Details</Typography>
      {/* Table to display alarm details */}
      
      <TableContainer component={Paper} 
        sx={{
          maxHeight: { xs: '60vh', sm: '70vh', md: '75vh' },
          overflowY: 'auto',
          '& .MuiTable-root': {
            tableLayout: 'fixed',
            width: '100%'
          },
          '& .MuiTableCell-root': {
            padding: { xs: '8px 6px', sm: '12px 8px', md: '16px' },
            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
            minWidth: { xs: '150px', sm: '200px' },
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            verticalAlign: 'top'
          },
          '& .MuiTableCell-head': {
            backgroundColor: '#fff',
            position: 'sticky',
            top: 0,
            fontWeight: 'bold',
            zIndex: 1
          }
        }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                    position: 'sticky',
                    fontWeight: 'bold',
                  }}>Action</TableCell>
              <TableCell sx={{
                    position: 'sticky',
                    fontWeight: 'bold',
                  }}>Details</TableCell>
              <TableCell sx={{
                    position: 'sticky',
                    fontWeight: 'bold',
                  }}>Created At</TableCell>
              <TableCell sx={{
                    position: 'sticky',
                    fontWeight: 'bold',
                  }}>Updated At</TableCell>
              <TableCell sx={{
                    position: 'sticky',
                    fontWeight: 'bold',
                  }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allAlarms
              .filter((alarm) => alarm.status === 'S') // Adjust the filter as needed
              .map((alarm) => (
                <TableRow key={alarm.id}> {/* Use a unique identifier */}
                  <TableCell>{alarm.parameter}</TableCell>
                  <TableCell>{alarm.value}</TableCell>
                  <TableCell>{new Date(alarm.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(alarm.updated_at).toLocaleString()}</TableCell>
                  <TableCell>{alarm.remarks}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>


    </Box>
  );
};

export default AlarmDetailsPage;
