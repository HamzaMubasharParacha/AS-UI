import React from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import { FlightTakeoff } from "@mui/icons-material";

interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}

interface DroneDetectionPanelProps {
  drones: DroneData[];
}

const DroneDetectionPanel: React.FC<DroneDetectionPanelProps> = ({
  drones,
}) => {
  const getThreatColor = (threatLevel: string) => {
    switch (threatLevel) {
      case "LOW":
        return "success";
      case "MEDIUM":
        return "warning";
      case "HIGH":
        return "error";
      case "CRITICAL":
        return "error";
      default:
        return "default";
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <Paper sx={{ p: 2, height: "300px", overflow: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <FlightTakeoff sx={{ mr: 1, color: "#00ff41" }} />
        <Typography variant="h6" sx={{ color: "#00ff41" }}>
          DRONE DETECTION
        </Typography>
      </Box>

      {drones.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ color: "#666", textAlign: "center", mt: 4 }}
        >
          NO TARGETS DETECTED
        </Typography>
      ) : (
        <List dense>
          {drones
            .slice(-10)
            .reverse()
            .map((drone, index) => (
              <React.Fragment key={drone.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {drone.id}
                        </Typography>
                        <Chip
                          size="small"
                          label={drone.threat_level}
                          color={getThreatColor(drone.threat_level) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ color: "#aaa" }}
                        >
                          Distance: {drone.distance.toFixed(0)}m | Speed:{" "}
                          {drone.speed.toFixed(1)} m/s
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ color: "#aaa" }}
                        >
                          Heading: {drone.heading.toFixed(0)}° | Detected:{" "}
                          {formatTime(drone.detected_at)}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ color: "#aaa" }}
                        >
                          Position: {drone.position[1].toFixed(4)}°N,{" "}
                          {drone.position[0].toFixed(4)}°E
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < drones.length - 1 && <Divider />}
              </React.Fragment>
            ))}
        </List>
      )}

      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #333" }}>
        <Typography variant="caption" sx={{ color: "#666" }}>
          Total Detections: {drones.length}
        </Typography>
      </Box>
    </Paper>
  );
};

export default DroneDetectionPanel;
