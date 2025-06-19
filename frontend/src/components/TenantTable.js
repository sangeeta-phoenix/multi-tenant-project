//src/components/TenantTable.js

import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField
} from "@mui/material";
import axios from "axios";

const TenantTable = () => {
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState(null);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editedTenant, setEditedTenant] = useState({ name: "", tenantId: "" });

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/tenants/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setError("Failed to fetch tenants. Please try again later.");
      setTenants([]);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleView = (tenant) => {
    setSelectedTenant(tenant);
    setIsViewOpen(true);
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setEditedTenant({ name: tenant.name, tenantId: tenant.tenantId });
    setIsEditOpen(true);
  };

  const handleUpdateTenant = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/tenants/${selectedTenant._id}`, editedTenant, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsEditOpen(false);
      fetchTenants(); // Refresh table
    } catch (error) {
      console.error("Error updating tenant:", error);
    }
  };

  return (
    <Paper sx={{ maxWidth: 800, margin: "auto", p: 3, mt: 5 }}>
      <Typography variant="h6" gutterBottom>Tenant List</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tenant Name</TableCell>
              <TableCell>Tenant ID</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant._id}>
                <TableCell>{tenant.name}</TableCell>
                <TableCell>{tenant.tenantId}</TableCell>
                <TableCell>{new Date(tenant.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => handleView(tenant)}>View</Button>
                  <Button variant="contained" size="small" onClick={() => handleEdit(tenant)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onClose={() => setIsViewOpen(false)}>
        <DialogTitle>View Tenant</DialogTitle>
        <DialogContent>
          {selectedTenant && (
            <>
              <Typography><strong>Name:</strong> {selectedTenant.name}</Typography>
              <Typography><strong>Tenant ID:</strong> {selectedTenant.tenantId}</Typography>
              <Typography><strong>Created At:</strong> {new Date(selectedTenant.createdAt).toLocaleString()}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Tenant Name"
            fullWidth
            value={editedTenant.name}
            onChange={(e) => setEditedTenant({ ...editedTenant, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Tenant ID"
            fullWidth
            value={editedTenant.tenantId}
            onChange={(e) => setEditedTenant({ ...editedTenant, tenantId: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateTenant}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TenantTable;
