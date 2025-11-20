import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Assessment } from "@mui/icons-material";

interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}

interface DataVisualizationProps {
  drones: DroneData[];
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ drones }) => {
  // Prepare data for threat level distribution
  const threatData = [
    {
      name: "LOW",
      value: drones.filter((d) => d.threat_level === "LOW").length,
      color: "#00ff41",
    },
    {
      name: "MEDIUM",
      value: drones.filter((d) => d.threat_level === "MEDIUM").length,
      color: "#ffaa00",
    },
    {
      name: "HIGH",
      value: drones.filter((d) => d.threat_level === "HIGH").length,
      color: "#ff8800",
    },
    {
      name: "CRITICAL",
      value: drones.filter((d) => d.threat_level === "CRITICAL").length,
      color: "#ff4444",
    },
  ];

  // Prepare data for distance distribution
  const distanceData = [
    { range: "0-500m", count: drones.filter((d) => d.distance <= 500).length },
    {
      range: "500-1000m",
      count: drones.filter((d) => d.distance > 500 && d.distance <= 1000)
        .length,
    },
    {
      range: "1000-2000m",
      count: drones.filter((d) => d.distance > 1000 && d.distance <= 2000)
        .length,
    },
    { range: "2000m+", count: drones.filter((d) => d.distance > 2000).length },
  ];

  // Prepare data for detection timeline (last 10 detections)
  const timelineData = drones.slice(-10).map((drone, index) => ({
    detection: index + 1,
    distance: drone.distance,
    threat:
      drone.threat_level === "CRITICAL"
        ? 4
        : drone.threat_level === "HIGH"
        ? 3
        : drone.threat_level === "MEDIUM"
        ? 2
        : 1,
  }));

  return (
    <Paper sx={{ p: 2, height: "300px" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Assessment sx={{ mr: 1, color: "#00ff41" }} />
        <Typography variant="h6" sx={{ color: "#00ff41" }}>
          DATA VISUALIZATION
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, height: "calc(100% - 50px)" }}>
        {/* Threat Level Distribution */}
        <Box sx={{ flex: 1, height: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
            THREAT DISTRIBUTION
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={threatData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                dataKey="value"
              >
                {threatData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Distance Distribution */}
        <Box sx={{ flex: 1, height: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
            DISTANCE RANGES
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="range"
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={{ stroke: "#333" }}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={{ stroke: "#333" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#00ff41" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Detection Timeline */}
        <Box sx={{ flex: 1, height: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
            DETECTION TIMELINE
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="detection"
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={{ stroke: "#333" }}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={{ stroke: "#333" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="distance"
                stroke="#00ff41"
                strokeWidth={2}
                dot={{ fill: "#00ff41", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
};

export default DataVisualization;
