import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, Typography, TextField, Button,
  Checkbox, FormControlLabel, Paper, Grid
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 70;

const ServiceRequestForm = () => {
  const { title } = useParams();
  const navigate = useNavigate();
  
  const [requestId, setRequestId] = useState('');
  const [formData, setFormData] = useState({
    dbName: '',
    ip: '',
    permission: false,
    adminName: '',
    additionalInfo: '',
  });

  const email = localStorage.getItem('email') || '';
  const emailPrefix = email.split('@')[0];

  useEffect(() => {
    if (email) {
      const generatedId = `${emailPrefix}-${Date.now()}`;
      setRequestId(generatedId);
    } else {
      alert("User not found. Please log in again.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      requestId,
      dbName: formData.dbName,
      ip: formData.ip,
      permission: formData.permission,
      adminName: formData.adminName,
      additionalInfo: formData.additionalInfo,
      createdBy: emailPrefix,          // required by controller
      reporterEmail: email             // saved as createdByEmail
    };

    try {
      const response = await axios.post("/api/service-requests", payload);
      alert("Service request submitted successfully!");

      // Reset form after submission
      setFormData({
        dbName: '',
        ip: '',
        permission: false,
        adminName: formData.adminName, // retain admin name
        additionalInfo: '',
      });

      const newId = `${emailPrefix}-${Date.now()}`;
      setRequestId(newId);
    } catch (error) {
      console.error("Error submitting request:", error.response?.data || error.message);
      alert("Failed to submit request.");
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            alignItems: 'center',
            pt: 2,
          },
        }}
      >
        <HomeIcon sx={{ mb: 4, color: 'grey.600', cursor: 'pointer' }} onClick={() => navigate('/service-dashboard')} />
        <DescriptionIcon sx={{ mb: 4, color: 'grey.600', cursor: 'pointer' }} onClick={() => navigate('/catalog')} />
        <ReportProblemIcon sx={{ color: 'grey.600', cursor: 'pointer' }} onClick={() => navigate('/my-items')} />
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 4, backgroundColor: '#f4f6f8', minHeight: '100vh' }}
      >
        <Typography variant="h5" gutterBottom>
          New Service Request
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Submit request for: <strong>{title}</strong>
        </Typography>

        <Paper elevation={3} sx={{ p: 4, maxWidth: 700 }}>
          <Box mb={3}>
            <Typography><strong>Request ID:</strong> <span style={{ color: '#1976d2' }}>{requestId}</span></Typography>
            <Typography><strong>Status:</strong> <span style={{ color: 'green' }}>logged</span></Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Database Name"
                  fullWidth
                  name="dbName"
                  value={formData.dbName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="IP Address"
                  fullWidth
                  name="ip"
                  value={formData.ip}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permission}
                      onChange={handleChange}
                      name="permission"
                    />
                  }
                  label="Permission"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Admin/User Name"
                  fullWidth
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Additional Info"
                  fullWidth
                  multiline
                  minRows={3}
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Submit Request
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default ServiceRequestForm;
