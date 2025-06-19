//src/components/TenantDashboard.js

import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import axios from "axios";
import TenantLayout from "../layouts/TenantLayout";

const TenantDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const token = localStorage.getItem("token");
  const [accessLogs, setAccessLogs] = useState([]);
  const [loadingAccessLogs, setLoadingAccessLogs] = useState(true);


  const fetchTenants = async () => {
    try {
      const res = await axios.get("/api/tenant-dashboard/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(res.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await axios.get("/api/tenant-dashboard/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResources(res.data);
    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchAccessLogs = async () => {
    try {
      const res = await axios.get("/api/tenant-dashboard/access-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Access Logs Response:", res.data);
      const logs = Array.isArray(res.data) ? res.data : [];
      setAccessLogs(logs);
    } catch (err) {
      console.error("Error fetching access logs:", err);
      setAccessLogs([]);
    } finally {
      setLoadingAccessLogs(false);
    }
  };
  
  useEffect(() => {
    fetchTenants();
    fetchResources();
    fetchAccessLogs();
  }, []);

  const filteredResources = selectedTenant
    ? resources.filter((res) => res.tenantUUID === selectedTenant)
    : resources;


  return (
    <TenantLayout>
    <Container>
      <Typography variant="h4" gutterBottom mt={4}>
        Tenant Admin Dashboard
      </Typography>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="tenant-select-label">Filter by Tenant</InputLabel>
        <Select
          labelId="tenant-select-label"
          value={selectedTenant}
          label="Filter by Tenant"
          onChange={(e) => setSelectedTenant(e.target.value)}
        >
          <MenuItem value="">All Tenants</MenuItem>
          {tenants.map((tenant) => (
            <MenuItem key={tenant._id} value={tenant.tenantId}>
              {tenant.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* RESOURCES TABLE */}
      <Typography variant="h6" gutterBottom>
        Resources
      </Typography>
      {loadingResources ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ mb: 6 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Resource Name</strong></TableCell>
                <TableCell><strong>Tenant Name</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Created At</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResources.map((resource) => (
                <TableRow key={resource._id}>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell>{resource.tenantName}</TableCell>
                  <TableCell>{resource.type}</TableCell>
                  <TableCell>
                    {new Date(resource.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {filteredResources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No resources found for selected tenant.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

<Divider sx={{ my: 4 }} />

<Typography variant="h6" gutterBottom>
  Users Who Accessed Tenants
</Typography>

{loadingAccessLogs ? (
  <CircularProgress />
) : accessLogs.length === 0 ? (
  <Typography>No access logs available.</Typography>
) : (
  <Paper sx={{ mt: 3 }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell><strong>Username</strong></TableCell>
          <TableCell><strong>Email</strong></TableCell>
          <TableCell><strong>Tenant Name</strong></TableCell>
          <TableCell><strong>Role</strong></TableCell>
          <TableCell><strong>Accessed At</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {accessLogs
          .filter((log) =>
            !["tenant-admin", "super-admin"].includes(log.role) &&
            (!selectedTenant || log.tenantId === selectedTenant)
        )
          .map((log) => (
            <TableRow key={log._id}>
              <TableCell>{log.username}</TableCell>
              <TableCell>{log.email}</TableCell>
              <TableCell>{log.tenantName}</TableCell>
              <TableCell>{log.role|| "user"}</TableCell>
              <TableCell>{log.accessedAt ? new Date(log.accessedAt).toLocaleString():"Unknown"}</TableCell>
            </TableRow>
          ))}
        {accessLogs.filter(
          (log) =>
            !["tenant-admin", "super-admin"].includes(log.role) &&
            (!selectedTenant || log.tenantId === selectedTenant)
        ).length === 0 && (
          <TableRow>
            <TableCell colSpan={5} align="center">
              No user access logs for selected tenant.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Paper>
)}


    </Container>
    </TenantLayout>
  );
};

export default TenantDashboard;
