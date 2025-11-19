import React from "react";
import { Paper, Typography, Box, LinearProgress, Chip } from "@mui/material";
import { Security } from "@mui/icons-material";

interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}

interface ThreatAssessmentProps {
  drones: DroneData[];
}

const ThreatAssessment: React.FC<ThreatAssessmentProps> = ({ drones }) => {
  const threatCounts = {
    LOW: drones.filter((d) => d.threat_level === "LOW").length,
    MEDIUM: drones.filter((d) => d.threat_level === "MEDIUM").length,
    HIGH: drones.filter((d) => d.threat_level === "HIGH").length,
    CRITICAL: drones.filter((d) => d.threat_level === "CRITICAL").length,
  };

  const totalThreats = drones.length;
  const highPriorityThreats = threatCounts.HIGH + threatCounts.CRITICAL;

  const overallThreatLevel = () => {
    if (threatCounts.CRITICAL > 0)
      return { level: "CRITICAL", color: "#ff4444", progress: 100 };
    if (threatCounts.HIGH > 0)
      return { level: "HIGH", color: "#ff8800", progress: 80 };
    if (threatCounts.MEDIUM > 0)
      return { level: "MEDIUM", color: "#ffaa00", progress: 60 };
    if (threatCounts.LOW > 0)
      return { level: "LOW", color: "#00ff41", progress: 30 };
    return { level: "SECURE", color: "#00ff41", progress: 0 };
  };

  const threat = overallThreatLevel();

  const getClosestThreat = () => {
    if (drones.length === 0) return null;
    return drones.reduce((closest, current) =>
      current.distance < closest.distance ? current : closest
    );
  };

  const closestThreat = getClosestThreat();

  return (
    <Paper sx={{ p: 2, height: "250px" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Security sx={{ mr: 1, color: "#00ff41" }} />
        <Typography variant="h6" sx={{ color: "#00ff41" }}>
          THREAT ASSESSMENT
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2">THREAT LEVEL</Typography>
          <Chip
            label={threat.level}
            size="small"
            sx={{
              backgroundColor: threat.color,
              color: "#000",
              fontWeight: "bold",
            }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={threat.progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: "#333",
            "& .MuiLinearProgress-bar": {
              backgroundColor: threat.color,
            },
          }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{ color: "#00ff41", fontFamily: "monospace" }}
          >
            {totalThreats}
          </Typography>
          <Typography variant="caption" sx={{ color: "#666" }}>
            TOTAL TARGETS
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{ color: "#ff4444", fontFamily: "monospace" }}
          >
            {highPriorityThreats}
          </Typography>
          <Typography variant="caption" sx={{ color: "#666" }}>
            HIGH PRIORITY
          </Typography>
        </Box>
      </Box>

      {closestThreat && (
        <Box sx={{ mt: 2, p: 1, backgroundColor: "#1a1a1a", borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: "#666" }}>
            CLOSEST THREAT
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {closestThreat.id} - {closestThreat.distance.toFixed(0)}m
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: threatCounts.CRITICAL > 0 ? "#ff4444" : "#ffaa00" }}
          >
            {closestThreat.threat_level} PRIORITY
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {threatCounts.CRITICAL > 0 && (
          <Chip
            size="small"
            label={`${threatCounts.CRITICAL} CRITICAL`}
            color="error"
          />
        )}
        {threatCounts.HIGH > 0 && (
          <Chip
            size="small"
            label={`${threatCounts.HIGH} HIGH`}
            sx={{ backgroundColor: "#ff8800" }}
          />
        )}
        {threatCounts.MEDIUM > 0 && (
          <Chip
            size="small"
            label={`${threatCounts.MEDIUM} MEDIUM`}
            color="warning"
          />
        )}
        {threatCounts.LOW > 0 && (
          <Chip
            size="small"
            label={`${threatCounts.LOW} LOW`}
            color="success"
          />
        )}
      </Box>
    </Paper>
  );
};

export default ThreatAssessment;
