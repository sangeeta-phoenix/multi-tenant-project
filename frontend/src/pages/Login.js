// src/pages/Login.js

import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Box
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const selectedTenantId = localStorage.getItem("selectedTenantId");
        const response = await axios.post("http://localhost:5000/api/auth/login", {
            ...credentials,
            tenantId: selectedTenantId,
        });

        const { token } = response.data; // Correctly destructure the token
        localStorage.setItem("token", token); // Store the token
        localStorage.setItem("userId", response.data.user.id); // Store user ID
        localStorage.setItem("role", credentials.role);
        localStorage.setItem("tenantId", selectedTenantId);
        localStorage.setItem("email", credentials.email);

        switch (credentials.role) {
            case "super-admin":
                navigate("/admin-dashboard");
                break;
            case "tenant-admin":
                navigate("/tenant-dashboard");
                break;
            default:
                navigate("/dashboard");
                break;
        }
    } catch (error) {
        if (error.response?.status === 404) {
            alert("User  not found. Redirecting to register page...");
            setTimeout(() => navigate("/register"), 2000);
        } else {
            alert("Login failed. Please check your credentials.");
        }
    }
};


  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={credentials.role}
              onChange={handleChange}
              required
              label="Role"
            >
              <MenuItem value="super-admin">Super Admin</MenuItem>
              <MenuItem value="tenant-admin">Tenant Admin</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
