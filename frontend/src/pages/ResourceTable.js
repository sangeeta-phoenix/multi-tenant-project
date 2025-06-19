//src/pages/ResourceTable.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Typography,
  Box,Paper,MenuItem,
} from "@mui/material";
import TenantLayout from "../layouts/TenantLayout";

const API_URL = "http://localhost:5000/api/resources";

const ResourceTable = () => {
  const [resources, setResources] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState("");
const [selectedRegion, setSelectedRegion] = useState("All");
  useEffect(() => {
    fetchResources(selectedRegion);
  }, [selectedRegion]);

  const fetchResources = async (region = "All") => {
  try {
    const token = localStorage.getItem("token");
    const url =
      region === "All"
        ? API_URL
        : `${API_URL}?region=${encodeURIComponent(region)}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setResources(res.data);
  } catch (err) {
    setError("Error fetching resources");
  }
};


  const handleEdit = (resource) => {
    setEditId(resource._id);
    setEditData({ ...resource });
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/${editId}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditId(null);
      fetchResources();
    } catch (err) {
      setError("Error updating resource");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchResources();
    } catch (err) {
      setError("Error deleting resource");
    }
  };

 const getStatusDisplay = (status) => {
    let color;
    switch (status) {
      case "Active":
        color = "green";
        break;
      case "Idle":
        color = "orange";
        break;
      case "Terminated":
        color = "red";
        break;
      default:
        color = "gray";
    } 
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: color,
            mr: 1,
          }}
        />
        {status}
      </Box>
    );
  };

  const filteredResources =
    selectedRegion === "All"
      ? resources
      : resources.filter((r) => r.region === selectedRegion);

  const uniqueRegions = [...new Set(resources.map((r) => r.region))];

  return (
    <TenantLayout>
      <Box
    component={Paper}
    elevation={3}
    sx={{
      width: "95%",              // Adjust width to your liking
    marginLeft: "auto",        // Center horizontally
    marginRight: "auto",
    mt: 5,
    p: 3,
    boxSizing: "border-box",
    }}
  >
    <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Resource List</Typography>
          <TextField
            select
            label="Filter by Region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="All">All</MenuItem>
            {uniqueRegions.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer>
        <Table>
          <TableHead>
  <TableRow>
    <TableCell>Name</TableCell>
    <TableCell>Provider</TableCell>
    <TableCell>Cost</TableCell>
    <TableCell>Status</TableCell>
    {
      // Show CPU column only if at least one non-VM resource exists
      filteredResources.some(r => r.type !== "VM") && (
        <TableCell>CPU</TableCell>
      )
    }
    <TableCell>Memory</TableCell>
    <TableCell><strong>Tenant Name</strong></TableCell>
    <TableCell align="center" sx={{ minWidth: 160 }}>Actions</TableCell>
  </TableRow>
</TableHead>
          <TableBody>
            {filteredResources.map((res) => (
              <TableRow key={res._id}>
                <TableCell>
                  {editId === res._id ? (
                    <TextField
                      name="name"
                      value={editData.name}
                      onChange={handleChange}
                      variant="standard"
                    />
                  ) : (
                    res.name
                  )}
                </TableCell>
                <TableCell>
                  {editId === res._id ? (
                    <TextField
                      name="provider"
                      value={editData.provider}
                      onChange={handleChange}
                      variant="standard"
                    />
                  ) : (
                    res.provider
                  )}
                </TableCell>
                <TableCell>
                  {editId === res._id ? (
                    <TextField
                      name="cost"
                      value={editData.cost}
                      onChange={handleChange}
                      variant="standard"
                    />
                  ) : (
                    res.cost
                  )}
                </TableCell>
                <TableCell>
                    {editId === res._id ? (
                      <TextField
                        name="status"
                        value={editData.status}
                        onChange={handleChange}
                        variant="standard"
                        select
                        fullWidth
                      >
                        {["Active", "Idle", "Terminated"].map((status) => (
                          <MenuItem key={status} value={status}>
                            {getStatusDisplay(status)}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      getStatusDisplay(res.status)
                    )}
                  </TableCell>
                   <TableCell>
               {res.type === "VM" ? (
       "---"):
          editId === res._id ? (
            <TextField
              name="cpu"
              value={editData.cpu}
              onChange={handleChange}
              variant="standard"
            />
          ) : (
            res.cpu
          )}
        </TableCell>
                <TableCell align="center">
                  {editId === res._id ? (
                    <TextField
                      name="memory"
                      value={editData.memory}
                      onChange={handleChange}
                      variant="standard"
                    />
                  ) : (
                    res.memory
                  )}
                </TableCell>
                <TableCell align="center">
                {res.tenantName || 'Unknown Tenant'}

                </TableCell>
                <TableCell align="center">
                  {editId === res._id ? (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpdate}
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => handleEdit(res)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => handleDelete(res._id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>
    </TenantLayout>
  );
};

export default ResourceTable;
