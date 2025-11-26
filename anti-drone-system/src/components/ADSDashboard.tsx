import React, { useState, useEffect, useCallback } from "react";
import { Typography, Box, IconButton, Button } from "@mui/material";
import {
  Dashboard,
  Radar,
  Assessment,
  Security,
  BarChart,
  Timeline,
  PieChart,
  ShowChart,
  ChevronLeft,
  ChevronRight,
  Close as CloseIcon,
  Edit,
  Polyline,
  CropFree,
  Room,
  Straighten,
  Analytics,
  SettingsInputAntenna, // Add this for jammer icon
} from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
 
import CesiumMap from "./CesiumMap";
import DroneDetectionPanel from "./DroneDetectionPanel";
import ThreatAssessment from "./ThreatAssessment";
import CountermeasureControls from "./CountermeasureControls";
import SystemStatus from "./SystemStatus";
import DataVisualization from "./DataVisualization";
import SpectrumAnalyzer from "./SpectrumAnalyzer";
import JammerControls from "./JammerControls"; // We'll create this component
import "../ADSDashboard.css";
import { BASE_URL } from "../api/config";

interface DashboardProps {
  setToken: (token: string | null) => void;
}
 
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00ff41",
    },
    secondary: {
      main: "#ff4444",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    error: {
      main: "#ff4444",
    },
    warning: {
      main: "#ffaa00",
    },
    success: {
      main: "#00ff41",
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace',
    h4: {
      fontWeight: 700,
      letterSpacing: "0.1em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "0.05em",
    },
  },
});
 
interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}
 
interface FloatingCard {
  id: string;
  title: string;
  component: string;
  position: { x: number; y: number };
  visible: boolean;
  minimized: boolean;
  lastActivity: string;
  status: "active" | "inactive" | "warning" | "error";
}
 
interface CardLog {
  id: string;
  title: string;
  status: "active" | "inactive" | "warning" | "error";
  lastActivity: string;
  description: string;
  icon: React.ReactNode;
}
 
const ADSDashboard: React.FC<DashboardProps> = ({ setToken }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [jammerStatus, setJammerStatus] = useState<'stopped' | 'starting' | 'running' | 'stopping'>('stopped');

  const jammerStart = async () => {
   
    setJammerStatus('starting');
  
    try {
      const response = await fetch(
        "http://192.168.100.110:8080/api/jammer3000/1/jam/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            frequencyBand: "2.4GHz",
            powerAttenuation: 18
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("API Response:", data);
      setJammerStatus('running');
    } catch (error) {
      console.error("Error:", error);
      setJammerStatus('stopped');
    }
  };

  const jammerStop = async () => {
    setJammerStatus('stopping');
  
    try {
      const response = await fetch(
        "http://192.168.100.110:8080/api/jammer3000/1/jam/stop",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("API Response:", data);
      setJammerStatus('stopped');
    } catch (error) {
      console.error("Error:", error);
      setJammerStatus('stopped');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError("");
  
    try {
      const token = sessionStorage.getItem("token");
      console.log("Logging out with token :", token);
  
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }
  
      const response = await fetch(
        "http://192.168.100.110:8080/api/auth/logout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.ok) {
        console.log("Logout successful");
        sessionStorage.removeItem("token");
        setToken(null);
      } else {
        const data = await response.json();
        setError(data.message || "Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const [systemActive] = useState(true);
  const [detectedDrones, setDetectedDrones] = useState<DroneData[]>([]);
  const [drawingToolsEnabled, setDrawingToolsEnabled] = useState(false);

  const Drones = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/drone-detection/drones`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token || "219498f3-03f9-41a0-9140-eec5bfe0e311"}`,
        },
      });
  
      const data = await response.json();
      const drones: DroneData[] = data.data.map((drone: any) => ({
        id: drone.name,
        position: [
          drone.longitude || 0,
          drone.latitude || 0,
          drone.height || 0,
        ],
        threat_level: "HIGH",
        distance: drone.distance || 0,
        speed: drone.speed || 0,
        heading: Number(drone.direction) || 0,
        detected_at: drone.created_time || new Date().toISOString(),
      }));
  
      setDetectedDrones(drones);
    } catch (error) {
      console.error("error");
    }
  };
 
  useEffect(() => {
    Drones();
    const intervalId = setInterval(Drones, 1000);
    return () => clearInterval(intervalId);
  }, []);
 
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedCardId: string | null;
    dragOffset: { x: number; y: number };
    startPosition: { x: number; y: number };
  }>({
    isDragging: false,
    draggedCardId: null,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
  });
 
  const [floatingCards, setFloatingCards] = useState<FloatingCard[]>([
    {
      id: "system-status",
      title: "System Status",
      component: "SystemStatus",
      position: { x: 100, y: 100 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
      status: "active",
    },
    {
      id: "drone-detection",
      title: "Drone Detection",
      component: "DroneDetectionPanel",
      position: { x: 450, y: 100 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
      status: "active",
    },
    {
      id: "threat-assessment",
      title: "Threat Assessment",
      component: "ThreatAssessment",
      position: { x: 100, y: 350 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
      status: "warning",
    },
    {
      id: "countermeasures",
      title: "Countermeasures",
      component: "CountermeasureControls",
      position: { x: 450, y: 350 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
      status: "inactive",
    },
    {
      id: "drawing-tools",
      title: "Map Drawing Tools",
      component: "DrawingTools",
      position: { x: 200, y: 200 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
      status: "inactive",
    },
    {
      id: "spectrum-analyzer",
      title: "Spectrum Analyzer",
      component: "SpectrumAnalyzer",
      position: { x: 800, y: 100 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
      status: "inactive",
    },
    {
      id: "jammer-controls",
      title: "Jammer Controls",
      component: "JammerControls",
      position: { x: 800, y: 400 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
      status: "inactive",
    },
  ]);
 
  const [systemStatus] = useState({
    radar: "ONLINE",
    countermeasures: "READY",
    communications: "ONLINE",
    power: 98,
  });
 
  const activeThreat = detectedDrones.find(
    (drone) =>
      drone.threat_level === "HIGH" || drone.threat_level === "CRITICAL"
  );
 
  const toggleCard = (cardId: string) => {
    setFloatingCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              visible: !card.visible,
              lastActivity: new Date().toLocaleTimeString(),
              status: !card.visible ? "active" : "inactive",
            }
          : card
      )
    );
  };
 
  const minimizeCard = (cardId: string) => {
    setFloatingCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, minimized: !card.minimized } : card
      )
    );
  };
 
  const updateCardPosition = (
    cardId: string,
    newPosition: { x: number; y: number }
  ) => {
    setFloatingCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, position: newPosition } : card
      )
    );
  };
 
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setDragState({
      isDragging: true,
      draggedCardId: cardId,
      dragOffset: { x: startX, y: startY },
      startPosition: { x: e.clientX, y: e.clientY },
    });
  };
 
  const handleTouchStart = (e: React.TouchEvent, cardId: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const startX = touch.clientX - rect.left;
    const startY = touch.clientY - rect.top;
    setDragState({
      isDragging: true,
      draggedCardId: cardId,
      dragOffset: { x: startX, y: startY },
      startPosition: { x: touch.clientX, y: touch.clientY },
    });
  };
 
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.draggedCardId) return;
      const newX = Math.max(
        20,
        Math.min(window.innerWidth - 400, e.clientX - dragState.dragOffset.x)
      );
      const newY = Math.max(
        20,
        Math.min(window.innerHeight - 250, e.clientY - dragState.dragOffset.y)
      );
      updateCardPosition(dragState.draggedCardId, { x: newX, y: newY });
    },
    [
      dragState.isDragging,
      dragState.draggedCardId,
      dragState.dragOffset.x,
      dragState.dragOffset.y,
    ]
  );
 
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragState.isDragging || !dragState.draggedCardId) return;
      const touch = e.touches[0];
      const newX = Math.max(
        20,
        Math.min(
          window.innerWidth - 400,
          touch.clientX - dragState.dragOffset.x
        )
      );
      const newY = Math.max(
        20,
        Math.min(
          window.innerHeight - 250,
          touch.clientY - dragState.dragOffset.y
        )
      );
      updateCardPosition(dragState.draggedCardId, { x: newX, y: newY });
    },
    [
      dragState.isDragging,
      dragState.draggedCardId,
      dragState.dragOffset.x,
      dragState.dragOffset.y,
    ]
  );
 
  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      draggedCardId: null,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
    });
  };
 
  const handleTouchEnd = () => {
    setDragState({
      isDragging: false,
      draggedCardId: null,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
    });
  };
 
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleTouchMove]);
 
  const renderCardContent = (card: FloatingCard) => {
    switch (card.component) {
      case "SystemStatus":
        return <SystemStatus status={systemStatus} />;
      case "DroneDetectionPanel":
        return <DroneDetectionPanel drones={detectedDrones} />;
      case "ThreatAssessment":
        return <ThreatAssessment drones={detectedDrones} />;
      case "CountermeasureControls":
        return (
          <CountermeasureControls
            activeThreat={activeThreat}
            systemActive={systemActive}
          />
        );
      case "DrawingTools":
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#00ff41" }}>
              Map Drawing Tools
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  border: "1px solid #00ff41",
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "rgba(0, 255, 65, 0.1)" },
                }}
                onClick={() => setDrawingToolsEnabled(!drawingToolsEnabled)}
              >
                <Typography variant="body2">
                  Drawing Tools: {drawingToolsEnabled ? "ENABLED" : "DISABLED"}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#888", mt: 1 }}>
                Available Tools:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Polyline sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Polygon</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CropFree sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Rectangle</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Room sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Circle</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Straighten sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Line</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      case "SpectrumAnalyzer":
        return <SpectrumAnalyzer />;
      case "JammerControls":
        return (
          <JammerControls
            jammerStatus={jammerStatus}
            onStart={jammerStart}
            onStop={jammerStop}
          />
        );
      case "DataVisualization":
        return <DataVisualization drones={detectedDrones} />;
      default:
        return <Box>Unknown component</Box>;
    }
  };

  // Add spectrum button handler
  const handleSpectrumClick = () => {
    setShowSpectrum(true);
    toggleCard("spectrum-analyzer");
  };

  // Add jammer controls handler
  const handleJammerControlsClick = () => {
    toggleCard("jammer-controls");
  };
 
  const leftCardLogs: CardLog[] = [
    {
      id: "system-status",
      title: "System Status",
      status:
        floatingCards.find((c) => c.id === "system-status")?.status ||
        "inactive",
      lastActivity:
        floatingCards.find((c) => c.id === "system-status")?.lastActivity || "",
      description: "System health and operational status",
      icon: <Dashboard />,
    },
    {
      id: "drone-detection",
      title: "Drone Detection",
      status:
        floatingCards.find((c) => c.id === "drone-detection")?.status ||
        "inactive",
      lastActivity:
        floatingCards.find((c) => c.id === "drone-detection")?.lastActivity ||
        "",
      description: `${detectedDrones.length} active targets detected`,
      icon: <Radar />,
    },
    {
      id: "threat-assessment",
      title: "Threat Assessment",
      status: activeThreat ? "error" : "active",
      lastActivity:
        floatingCards.find((c) => c.id === "threat-assessment")?.lastActivity ||
        "",
      description: activeThreat
        ? `Critical threat: ${activeThreat.id}`
        : "No active threats",
      icon: <Assessment />,
    },
    {
      id: "countermeasures",
      title: "Countermeasures",
      status: systemActive ? "active" : "inactive",
      lastActivity:
        floatingCards.find((c) => c.id === "countermeasures")?.lastActivity ||
        "",
      description: systemActive ? "Systems armed and ready" : "Systems offline",
      icon: <Security />,
    },
    {
      id: "drawing-tools",
      title: "Drawing Tools",
      status: drawingToolsEnabled ? "active" : "inactive",
      lastActivity:
        floatingCards.find((c) => c.id === "drawing-tools")?.lastActivity || "",
      description: drawingToolsEnabled
        ? "Drawing tools enabled"
        : "Drawing tools disabled",
      icon: <Edit />,
    },
    {
      id: "spectrum-analyzer",
      title: "Spectrum Analyzer",
      status: showSpectrum ? "active" : "inactive",
      lastActivity:
        floatingCards.find((c) => c.id === "spectrum-analyzer")?.lastActivity || "",
      description: "Real-time frequency spectrum analysis",
      icon: <Analytics />,
    },
    {
      id: "jammer-controls",
      title: "Jammer Controls",
      status: jammerStatus === 'running' ? 'active' : 
             jammerStatus === 'starting' || jammerStatus === 'stopping' ? 'warning' : 'inactive',
      lastActivity:
        floatingCards.find((c) => c.id === "jammer-controls")?.lastActivity || "",
      description: jammerStatus === 'running' ? "Jammer active" : 
                  jammerStatus === 'starting' ? "Jammer starting..." :
                  jammerStatus === 'stopping' ? "Jammer stopping..." : "Jammer ready",
      icon: <SettingsInputAntenna />,
    },
  ];
 
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        {/* Main Container */}
        <div className="main-container">
          {/* Application Header - Cleaned up */}
          <div className="app-header">
            <Typography variant="h5" className="app-title">
              ANTI-DRONE-SYSTEM
            </Typography>
            <div className="header-status">
              <div className="status-dot active"></div>
              <span className="status-text">OPERATIONAL</span>
            </div>
            <div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outlined"
              sx={{
                color: "#ff4444",
                borderColor: "#ff4444",
                ml: 2,
                "&:hover": { borderColor: "#ff6666", color: "#ff6666" },
              }}
            >
              Logout
            </Button>
          </div>
 
          {/* Full Screen Map */}
          <div className="map-container">
            <CesiumMap
              drones={detectedDrones}
              systemActive={systemActive}
              drawingToolsEnabled={drawingToolsEnabled}
            />
          </div>
 
          {/* Floating Cards */}
          {floatingCards
            .filter((card) => card.visible)
            .map((card) => (
              <Box
                key={card.id}
                className={`floating-card ${
                  card.minimized ? "floating-card-minimized" : ""
                } ${
                  dragState.draggedCardId === card.id
                    ? "floating-card-dragging"
                    : ""
                }`}
                sx={{
                  left: card.position.x,
                  top: card.position.y,
                }}
                onMouseDown={(e) => handleMouseDown(e, card.id)}
                onTouchStart={(e) => handleTouchStart(e, card.id)}
              >
                <Box className="floating-card-header">
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", color: "#00ff41" }}
                  >
                    {card.title}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => minimizeCard(card.id)}
                      sx={{ color: "#00ff41", p: 0.5 }}
                    >
                      {card.minimized ? <ChevronRight /> : <ChevronLeft />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => toggleCard(card.id)}
                      sx={{ color: "#ff4444", p: 0.5, ml: 0.5 }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
                {!card.minimized && (
                  <Box className="floating-card-content">
                    {renderCardContent(card)}
                  </Box>
                )}
              </Box>
            ))}
 
          {/* Left Fixed Column */}
          <div className="fixed-column left">
            <div className="column-header">
              <Dashboard className="column-icon" />
              <h3 className="column-title">CONTROL</h3>
            </div>
            <div className="column-content">
              {leftCardLogs.map((log) => (
                <div
                  key={log.id}
                  className={`column-item ${
                    floatingCards.find((c) => c.id === log.id)?.visible
                      ? "active"
                      : ""
                  }`}
                  onClick={() => toggleCard(log.id)}
                  title={log.description}
                >
                  <div className="column-item-icon">{log.icon}</div>
                  <div className="column-item-info">
                    <div className="column-item-title">{log.title}</div>
                    <div className="column-item-status">
                      <span className={`status-dot ${log.status}`}></span>
                      <span className="status-text">
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};
 
export default ADSDashboard;