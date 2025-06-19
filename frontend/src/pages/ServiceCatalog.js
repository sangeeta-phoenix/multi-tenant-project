//src/pages/ServiceCatalog.js

import React from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloudIcon from "@mui/icons-material/Cloud";
import StorageIcon from "@mui/icons-material/Storage";
import ComputerIcon from "@mui/icons-material/Computer";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useNavigate } from "react-router-dom";

const filters = [
  "Most popular",
  "Cloud",
  "Report New Incident",
  "Schedule Activity",
  "Security",
  "Storage",
  "Computer",
  "Database",
  "Load Balancer",
  "Monitoring",
  "Networking",
];

const services = [
  {
    category: "Load Balancer",
    title: "Add New Backend to LoadBalancer",
    description: "Add new backend to LoadBalancer",
    icon: <CloudIcon fontSize="large" />,
  },
  {
    category: "Schedule Activity",
    title: "Connectivity Test",
    description: "Connectivity Test",
    icon: <CalendarMonthIcon fontSize="large" />,
  },
  {
    category: "Database",
    title: "Create Backup for DB",
    description: "Create Backup for DB",
    icon: <StorageIcon fontSize="large" />,
  },
  {
    category: "Computer",
    title: "Create Backup System",
    description: "Create Backup System",
    icon: <ComputerIcon fontSize="large" />,
  },
];

const ServiceCatalog = () => {
  const navigate = useNavigate();

  const handleClick = (title) => {
    navigate(`/service-request/${encodeURIComponent(title)}`);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f4f7fa" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 250,
          backgroundColor: "#ffffff",
          p: 2,
          boxShadow: 2,
          overflowY: "auto",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Filter Options
        </Typography>
        <TextField
          fullWidth
          select
          variant="outlined"
          size="small"
          defaultValue="My Saved Filters"
        >
          <option>My Saved Filters</option>
        </TextField>
        <List>
          {filters.map((filter, index) => (
            <ListItem key={index} button>
              <ListItemText primary={filter} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Service Catalog
          </Typography>
          <TextField
            size="small"
            placeholder="Search"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Popular Items
        </Typography>

        <Grid container spacing={3}>
          {services.map((service, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                onClick={() => handleClick(service.title)}
                sx={{
                  height: 180,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <CardContent>
                  <Box sx={{ textAlign: "center" }}>
                    {service.icon}
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, fontWeight: "bold" }}
                    >
                      {service.category}
                    </Typography>
                    <Typography variant="subtitle1">{service.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {service.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ServiceCatalog;
