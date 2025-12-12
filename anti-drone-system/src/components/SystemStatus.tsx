import React from "react";
import { Paper, Typography, Box, LinearProgress, Chip } from "@mui/material";
import {
  Computer,
  Wifi,
  Radar,
  CheckCircle,
  Error,
} from "@mui/icons-material";

interface SystemStatusProps {
  status: {
    radar: string;
    countermeasures: string;
    communications: string;
  };
}

const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "ONLINE":
      case "READY":
        return "var(--primary-color)";
      case "WARNING":
        return "#ffaa00";
      case "OFFLINE":
      case "ERROR":
        return "#ff4444";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "ONLINE":
      case "READY":
        return <CheckCircle sx={{ color: "var(--primary-color)" }} />;
      case "WARNING":
        return <Error sx={{ color: "#ffaa00" }} />;
      case "OFFLINE":
      case "ERROR":
        return <Error sx={{ color: "#ff4444" }} />;
      default:
        return <Computer sx={{ color: "#666" }} />;
    }
  };

  const getPowerColor = (power: number) => {
    if (power > 75) return "var(--primary-color)";
    if (power > 50) return "#ffaa00";
    return "#ff4444";
  };

  const systemComponents = [
    {
      name: "JAMMER",
      status: status.radar,
      icon: <Radar />,
    },
    {
      name: "DF-10",
      status: status.countermeasures,
      icon: <Computer />,
    },
    {
      name: "SPOOFER",
      status: status.communications,
      icon: <Wifi />,
    },
  ];

  return (
    <Paper sx={{ p: 1, height: "200px" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Computer sx={{ mr: 1, color: "var(--primary-color)" }} />
        <Typography variant="h6" sx={{ color: "var(--primary-color)" }}>
          SYSTEM STATUS
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        {systemComponents.map((component) => (
          <Box
            key={component.name}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1,
              backgroundColor: "#1a1a1a",
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {component.icon}
              <Typography variant="body2" sx={{ ml: 1, fontSize: "0.8rem" }}>
                {component.name}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {getStatusIcon(component.status)}
              <Typography
                variant="caption"
                sx={{
                  ml: 1,
                  color: getStatusColor(component.status),
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                }}
              >
                {component.status}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default SystemStatus;
