import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import {
  Box,
  TableCell,
  TableContainer,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TextField,
  Grid,
  Paper
} from '@mui/material';
import { axiosAuthInstance } from '../services/axiosConfig';

function Vocabulary() {
  const navigate = useNavigate();
  const [verticals, setVerticals] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleVerticalClick = (vertical) => {
    setSelectedData(vertical);
  };

  const handleReset = () => {
    setSelectedData(null);
  };

  useEffect(() => {
    axiosAuthInstance
      .get('/verticals/vocabulary')
      .then((response) => {
        let data = [];

        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (Array.isArray(response.data.data)) {
          data = response.data.data;
        }

        setVerticals(data);
      })
      .catch((error) => {
        console.error('Error fetching verticals:', error);
      });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <div className="vocab-container">
        {/* Top-left back button only when no card is selected */}
        {!selectedData && (
          <Box sx={{ mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
        )}

        {/* Search + All Cards View */}
        {!selectedData && (
          <>
            {/* Search Bar */}
            <TextField
              label="Search Domain"
              variant="outlined"
              fullWidth
              margin="normal"
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Display Vertical Cards */}
            <Grid container spacing={3} sx={{ mt: 3 }}>
              {verticals
                .filter((item) =>
                  item.vertical_name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((item) => (
                  <Grid key={item.id} item xs={12} sm={6} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        boxShadow: 2,
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                      onClick={() => handleVerticalClick(item)}
                    >
                      <h3>{item.vertical_name}</h3>
                    </Paper>
                  </Grid>
                ))}

              {verticals.filter((item) =>
                item.vertical_name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <p>Domains are not available</p>
                    </Paper>
                  </Grid>
                )}
            </Grid>
          </>
        )}

        {/* Selected Card Detail View */}
        {selectedData && (
          <Box sx={{ mt: 1 }}>
            {/* Back icon to go to full list */}
            <Box sx={{ mb: 2 }}>
              <IconButton onClick={handleReset} sx={{ bgcolor: '#b4bce3', color: 'black' }}>
                <ArrowBackIcon />
              </IconButton>
            </Box>

            <Paper sx={{ p: 2 }}>
              <h3>{selectedData.vertical_name}</h3>
              <p>{selectedData.description}</p>

              {selectedData.parameters?.length > 0 && (
<TableContainer sx={{ maxHeight: 700, overflowY: 'auto' }}>
  <Table stickyHeader sx={{ width: '100%', tableLayout: 'auto' }}>
    <TableHead>
      <TableRow>
        {['Name', 'Description', 'Units', 'RDFS Type', 'Expected Types'].map((header) => (
          <TableCell
            key={header}
            sx={{
              fontWeight: 'bold',
              fontSize: '0.75rem',
              whiteSpace: 'normal',
              wordBreak: 'break-word'
            }}
          >
            {header}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {selectedData.parameters.map((param) => (
        <TableRow key={param.name}>
          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {param.name}
          </TableCell>
          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {param.pdescription}
          </TableCell>
          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {param.units}
          </TableCell>
          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {['float', 'integer'].includes(param.data_type.toLowerCase())
              ? 'Quantitative Property'
              : 'Text Property'}
          </TableCell>
          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {['float', 'integer'].includes(param.data_type.toLowerCase())
              ? 'Number Value Descriptor'
              : 'Text Value Descriptor'}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

              )}
            </Paper>
          </Box>
        )}
      </div>
    </Box>
  );
}

export default Vocabulary;
