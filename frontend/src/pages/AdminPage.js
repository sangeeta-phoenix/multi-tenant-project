// src/pages/AdminPage.js

import React, { useEffect, useState } from "react";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField,Box ,Typography} from "@mui/material";
import axios from "axios";
import mongoose from "mongoose";
import AdminLayout from "../layouts/AdminLayout";


const AdminPage = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [tenantId, setTenantId] = useState("");
    const[error, setError]=useState("");

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found, redirecting to login...");
                setError("User not authenticated. Please log in.");
                return;
            }
    
            const response = await axios.get("http://localhost:5000/api/admin/pending-registrations", {
                headers: { Authorization: `Bearer ${token}` }, // ✅ Include auth token
            });
    
            console.log("Fetched Pending Users:", response.data);
            setPendingUsers(response.data);
        } catch (error) {
            console.error("Error fetching pending users:", error);
            setError(error.response?.data?.message || "Failed to load pending users.");
        }
    };
    // Generate a unique Tenant ID for each user
    const generateTenantId = (userId) => {
        setTenantId({ ...tenantId, [userId]: new mongoose.Types.ObjectId().toHexString() });
    };

    const handleApprove = async (userId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You are not logged in. Please login again.");
            return;
        }
        if (!tenantId[userId]) {
            alert("Please generate a Tenant ID first.");
            return;
        }
    
        try {
            const response = await axios.post(
                `http://localhost:5000/api/admin/approve/${userId}`,
                { tenantId: tenantId[userId] },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            alert("User approved successfully!");
            fetchPendingUsers(); // Refresh list
        } catch (error) {
            console.error("Error approving user:", error.response?.data?.message || error.message);
            alert("Error approving user: " + (error.response?.data?.message || "Unknown error"));
        }
    };
    const handleDecline = async (userId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You are not logged in. Please log in.");
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/admin/decline/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert("User registration declined successfully.");
            fetchPendingUsers(); // Refresh the list after decline
        } catch (error) {
            console.error("Error declining user:", error);
            alert("Error declining user: " + (error.response?.data?.message || "Unknown error"));
        }
    };

    return (
        <AdminLayout>
      <Box
        sx={{
          marginLeft: "260px",
          padding: "40px",
          maxWidth: "1000px",
          marginRight: "auto"
        }}
      >
        <Typography 
  variant="h5" // or "h6" for slightly larger
  align="center" 
  gutterBottom
  sx={{ marginTop: 4 }}
>
          Pending User Approvals
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Paper elevation={3} sx={{ padding: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Tenant ID</TableCell>
                  <TableCell colSpan={2}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={tenantId[user._id] || ""}
                        placeholder="Generate Tenant ID"
                        disabled
                        sx={{ marginRight: 1 }}
                      />
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => generateTenantId(user._id)}
                      >
                        Generate
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleApprove(user._id)}
                      >
                        Approve
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleDecline(user._id)}
                      >
                        Decline
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default AdminPage;
