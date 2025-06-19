//src/components/Sidebaradmin.js
import { Drawer, List, ListItem, Tooltip,ListItemIcon } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ShieldIcon from "@mui/icons-material/Shield";


const Sidebaradmin = () => {
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
                  <ListItem button onClick={() => navigate("/admin-dashboard")}>
                    <ListItemIcon sx={{ color: "#fff" }}>
                      <DashboardIcon />
                    </ListItemIcon>
                  </ListItem>
                </Tooltip>
        
        <Tooltip title="Admin Page" placement="right">
          <ListItem button onClick={() => navigate("/admin-page")}>
          <ListItemIcon sx={{ color: "#fff" }}>
          <ShieldIcon />
          </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip title="Notifications" placement="right">
          <ListItem button onClick={() => navigate("/admin-notifi")}>
              <ListItemIcon sx={{ color: "#fff" }}>
          <NotificationsIcon />
          </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip title="Admin Settings" placement="right">
          <ListItem button onClick={() => navigate("/admin")}>
            <ListItemIcon sx={{ color: "#fff" }}>
          <SettingsIcon />
          </ListItemIcon>
          </ListItem>
        </Tooltip>


      </List>
    </Drawer>
  );
};

export default Sidebaradmin;


