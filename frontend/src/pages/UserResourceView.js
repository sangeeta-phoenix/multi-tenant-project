//src/pages/UserResourceView.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";
import UserLayout from "../layouts/UserLayout";

const UserResourceView = () => {
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const tenantId = localStorage.getItem("tenantId");
        const token = localStorage.getItem("token");
    
        if (!tenantId || !token) {
          console.error("Missing tenantId or token");
          return;
        }
    
        const response = await axios.get(`http://localhost:5000/api/resources/user?tenantId=${tenantId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        setResources(response.data);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
      }
    };
    
    fetchResources();
  }, []);
  
  return (
    <UserLayout>
    <Paper
        elevation={3}
        sx={{
          p: 3,
          mt: 5,
          width: "calc(100% - 360px)", // Adjust based on your sidebar width
          marginLeft: "260px", // Same as sidebar width
          boxSizing: "border-box",
        }}
      >
      <Typography variant="h6" gutterBottom>
        Your Tenant's Resources
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>CPU</TableCell>
              <TableCell>Memory</TableCell>
              <TableCell>Tenant Name</TableCell>

            </TableRow>
          </TableHead>
          <TableBody>
          {resources.length > 0 ? (
            resources.map((res) => (
      <TableRow key={res._id}>
        <TableCell>{res.name}</TableCell>
        <TableCell>{res.provider}</TableCell>
        <TableCell>{res.cost}</TableCell>
        <TableCell>{res.status}</TableCell>
        <TableCell>{res.cpu}</TableCell>
        <TableCell>{res.memory}</TableCell>
        <TableCell>{res.tenantName || 'N/A'}</TableCell>

      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={6}>No resources available</TableCell>
    </TableRow>
  )}
</TableBody>
        </Table>
      </TableContainer>
    </Paper>
    </UserLayout>
  );
};

export default UserResourceView;
