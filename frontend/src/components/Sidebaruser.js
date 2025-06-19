//src/components/Sidebaruser.js

import { Drawer, List, ListItem, ListItemIcon, Tooltip } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudIcon from "@mui/icons-material/Cloud"; // Resource icon (like instances)
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";

const Sidebaruser = () => {
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
          <ListItem button onClick={() => navigate("/dashboard")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <DashboardIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip title="Resources" placement="right" arrow>
          <ListItem button onClick={() => navigate("/user-resources")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <CloudIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip title="Notification" placement="right" arrow>
          <ListItem button onClick={() => navigate("/user-notifi")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <NotificationsIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip title="Service Requests" placement="right">
          <ListItem button onClick={() => navigate("/service-dashboard")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <AssignmentIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};

export default Sidebaruser;
