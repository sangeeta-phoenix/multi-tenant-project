// src/components/sidebartenant.js

import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudIcon from "@mui/icons-material/Cloud";
import GroupIcon from "@mui/icons-material/Group";
import NotificationsIcon from "@mui/icons-material/Notifications";




const SidebarTenant = () => {
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 80,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 80,
          boxSizing: "border-box",
          backgroundColor: "#005b96",
          color: "#fff",
        },
      }}
    >
      <List>
        <Tooltip title="Dashboard" placement="right" arrow>
          <ListItem button onClick={() => navigate("/tenant-dashboard")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <DashboardIcon />
            </ListItemIcon>
            
          </ListItem>
        </Tooltip>
        <Tooltip title="Resources" placement="right" arrow >
          <ListItem button onClick={() => navigate("/create")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <CloudIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip title="Tenants" placement="right" arrow>
          <ListItem button onClick={() => navigate("/create-tenant")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <GroupIcon />
            </ListItemIcon>
              </ListItem>
        </Tooltip>

        <Tooltip title="Notification" placement="right" arrow >
          <ListItem button onClick={() => navigate("/notifi")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <NotificationsIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};

export default SidebarTenant;
