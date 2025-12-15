import React, { useState, useEffect, useCallback, useRef } from "react";
import { Typography, Box, IconButton, Button, Snackbar, Alert } from "@mui/material";
import {
  Dashboard,
  Radar,
  Assessment,
  Analytics,
  Close as CloseIcon,
} from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import CesiumMap from "./CesiumMap";
import DroneDetectionPanel from "./DroneDetectionPanel";
import ThreatAssessment from "./ThreatAssessment";
import SystemStatus from "./SystemStatus";
import SpectrumAnalyzer from "./SpectrumAnalyzer";
import FloatingSpectrumAnalyzer from "./FloatingSpectrumAnalyzer";
import "../ADSDashboard.css";
// import "../index.css";
import { drone_data, logout, df_connectivity, cone_angle, spectrum_data, hardwareSystemId } from "../api/config";

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
  image: string;
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
}

interface CardLog {
  id: string;
  title: string;
  lastActivity: string;
  description: string;
  icon: React.ReactNode;
}

const ADSDashboard: React.FC<DashboardProps> = ({ setToken }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [check, setcheck] = useState("");
  const [fft, setFft] = useState<number[]>([]);
  
  // Use refs for better performance
  const dragStateRef = useRef({
    isDragging: false,
    draggedCardId: null as string | null,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 }
  });
 
  const cardsRef = useRef<FloatingCard[]>([]);
  
  // Floating spectrum analyzer state
  const [floatingSpectrum, setFloatingSpectrum] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    settings?: {
      minFreq: number;
      maxFreq: number;
      minPower: number;
      maxPower: number;
      colorScheme: string;
    };
  }>({
    visible: false,
    position: { x: 100, y: 100 }
  });

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [showDropHint, setShowDropHint] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info" | "warning"
  });

  // DEBUG: Log when floating spectrum state changes
  useEffect(() => {
    // console.log("Floating spectrum state changed:", floatingSpectrum);
  }, [floatingSpectrum]);

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }
      const response = await fetch(`${logout}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
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
  const [drawingToolsEnabled, setDrawingToolsEnabled] = useState(true);

  const Drones = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${drone_data}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token || "219498f3-03f9-41a0-9140-eec5bfe0e311"}`,
        },
      });
      const data = await response.json();
      const drones: DroneData[] = data.data.map((drone: any) => ({
        id: drone.name,
        image: drone.image,
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
    const intervalId = setInterval(Drones, 5000);
    return () => clearInterval(intervalId);
  }, []);

  
  const check_dfConnectivity = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${df_connectivity}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token || "219498f3-03f9-41a0-9140-eec5bfe0e311"}`,
        },
      });
      const data = await response.json();
      const check = data.data.available;
      setcheck(check);
    } catch (error) {
      console.error("error");
    }
  };

  useEffect(() => {
    check_dfConnectivity();
    const intervalId = setInterval(check_dfConnectivity, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch spectrum data for floating analyzer
  const fetchSpectrumData = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${spectrum_data}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();

      // console.log("Spectrum API Response:", json);

      if (!json?.data || !json.data[hardwareSystemId]) {
        return;
      }

      const powerSpectrum = json.data[hardwareSystemId].decodedValues?.powerSpectrum;

      if (powerSpectrum) {
        // console.log("Power spectrum found, length:", powerSpectrum.length);
        const cleaned = powerSpectrum.map((v: number) => isFinite(v) ? v : -100);
        setFft(cleaned);
      } else {
        // console.log("No power spectrum in response");
      }
    } catch (err) {
      console.error("Spectrum API Error:", err);
    }
  };

  // Fetch spectrum data periodically
  useEffect(() => {
    const interval = setInterval(fetchSpectrumData, 1000);
    fetchSpectrumData(); // Initial fetch
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const [floatingCards, setFloatingCards] = useState<FloatingCard[]>([
    {
      id: "system-status",
      title: "System Status",
      component: "SystemStatus",
      position: { x: 300, y: 100 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
    },
    {
      id: "drone-detection",
      title: "Drone Detection Panel",
      component: "DroneDetectionPanel",
      position: { x: 300, y: 200 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
    },
    {
      id: "threat-assessment",
      title: "Threat Assessment",
      component: "ThreatAssessment",
      position: { x: 300, y: 350 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
    },
    {
      id: "spectrum-analyzer",
      title: "Spectrum Analyzer",
      component: "SpectrumAnalyzer",
      position: { x: 300, y: 500 },
      visible: false,
      minimized: false,
      lastActivity: new Date().toLocaleTimeString(),
    },
  ]);

  const [coneAngle, setConeAngle] = useState<number>(0);
  const [coneElevation, setConeElevation] = useState<number>(0);
  const [jammerStatus, setjammerStatus] = useState("");
  
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = sessionStorage.getItem("token");
        
        if (!token) {
          console.warn("No token available for cone angle fetch");
          return;
        }

        const response = await fetch(cone_angle, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error("Authentication failed for cone angle fetch");
            return;
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jam_data = await response.json(); 
        setConeAngle(jam_data.data.ptz_azimuth);
        setConeElevation(jam_data.data.ptz_elevation);
        setjammerStatus(jam_data.data.is_connected);
      } catch (error) {
        console.error("Error fetching azimuth:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    cardsRef.current = floatingCards;
  }, [floatingCards]);

  const [systemStatus, setSystemStatus] = useState({
    radar: "OFFLINE",
    countermeasures: "OFFLINE",
    communications: "OFFLINE",
  });
  
 useEffect(() => {
  if (check !== "") {
    const radarStatus = check ? "ONLINE" : "OFFLINE";
    setSystemStatus(prev => ({
      ...prev,
      countermeasures: radarStatus
    }));
  }
  if (jammerStatus !== "") {
    const jammer = jammerStatus ? "ONLINE" : "OFFLINE";
    setSystemStatus(prev => ({
      ...prev,
      radar: jammer
    }));
  }
}, [check, jammerStatus]);
 

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

  // Global drag and drop handlers
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
      setDragPosition({ x: e.clientX, y: e.clientY });
      
      // Show drop hint if we're over the map area
      if (e.clientX > 250 && e.clientX < window.innerWidth - 250) {
        setShowDropHint(true);
      } else {
        setShowDropHint(false);
      }
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      // Only reset if we're leaving the window entirely
      if (e.clientX <= 0 || e.clientY <= 0 || 
          e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDraggingOver(false);
        setShowDropHint(false);
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      setShowDropHint(false);

      try {
        const data = e.dataTransfer?.getData('application/json');
        
        if (data) {
          const settings = JSON.parse(data);
          
          if (settings.type === 'spectrum') {
            const newPosition = {
              x: Math.max(10, Math.min(window.innerWidth - 410, e.clientX - 200)),
              y: Math.max(10, Math.min(window.innerHeight - 260, e.clientY - 125))
            };
            
            
            setFloatingSpectrum({
              visible: true,
              position: newPosition,
              settings
            });
            
            setSnackbar({
              open: true,
              message: "Spectrum Analyzer added to main screen",
              severity: "success"
            });
          }
        } else {
        }
      } catch (error) {
        console.error('Error parsing drag data:', error);
        setSnackbar({
          open: true,
          message: "Failed to add Spectrum Analyzer",
          severity: "error"
        });
      }
    };

    const handleGlobalDragEnd = () => {
      setIsDraggingOver(false);
      setShowDropHint(false);
    };

    // Add global event listeners
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);
    document.addEventListener('dragend', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('drop', handleGlobalDrop);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  // INSTANT DRAG START for floating cards
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    if (!(e.target as HTMLElement).closest('.floating-card-header')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const cardElement = e.currentTarget as HTMLElement;
    const rect = cardElement.getBoundingClientRect();
    
    dragStateRef.current = {
      isDragging: true,
      draggedCardId: cardId,
      dragOffset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      },
      startPosition: {
        x: rect.left,
        y: rect.top
      }
    };

    // Add dragging class immediately
    cardElement.classList.add('floating-card-dragging');
    
    // Set cursor immediately
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  // SMOOTH DRAGGING - Immediate response for floating cards
  const updateCardPositionOptimized = useCallback((clientX: number, clientY: number) => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.draggedCardId) return;

    const newX = Math.max(10, Math.min(window.innerWidth - 390, clientX - dragStateRef.current.dragOffset.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 200, clientY - dragStateRef.current.dragOffset.y));

    // Update the DOM directly for immediate response
    const cardElement = document.querySelector(`[data-card-id="${dragStateRef.current.draggedCardId}"]`) as HTMLElement;
    if (cardElement) {
      cardElement.style.left = `${newX}px`;
      cardElement.style.top = `${newY}px`;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;

    // Immediate update without waiting for animation frame for better responsiveness
    updateCardPositionOptimized(e.clientX, e.clientY);
  }, [updateCardPositionOptimized]);

  // Clean up drag state
  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.draggedCardId) return;

    // Get final position from DOM
    const cardElement = document.querySelector(`[data-card-id="${dragStateRef.current.draggedCardId}"]`) as HTMLElement;
    if (cardElement) {
      const finalX = parseInt(cardElement.style.left);
      const finalY = parseInt(cardElement.style.top);

      // Only update React state if position actually changed
      if (!isNaN(finalX) && !isNaN(finalY)) {
        updateCardPosition(dragStateRef.current.draggedCardId, { x: finalX, y: finalY });
      }

      // Remove dragging class
      cardElement.classList.remove('floating-card-dragging');
      
      // Reset inline styles to let React control the position
      cardElement.style.left = '';
      cardElement.style.top = '';
    }

    // Reset cursor and selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Reset drag state
    dragStateRef.current = {
      isDragging: false,
      draggedCardId: null,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 }
    };
  }, []);

  // Event listeners setup
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragStateRef.current.isDragging) {
        handleMouseMove(e);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const renderCardContent = (card: FloatingCard) => {
    switch (card.component) {
      case "SystemStatus":
        return <SystemStatus status={systemStatus} />;
      case "DroneDetectionPanel":
        return <DroneDetectionPanel />;
      case "ThreatAssessment":
        return <ThreatAssessment drones={detectedDrones} />;
      case "SpectrumAnalyzer":
        return <SpectrumAnalyzer />;
      default:
        return <Box>Unknown component</Box>;
    }
  };

  const leftCardLogs: CardLog[] = [
    {
      id: "system-status",
      title: "System Status",
      lastActivity:
        floatingCards.find((c) => c.id === "system-status")?.lastActivity || "",
      description: "System health and operational status",
      icon: <Dashboard />,
    },
    {
      id: "drone-detection",
      title: "Drone Detection",
      lastActivity:
        floatingCards.find((c) => c.id === "drone-detection")?.lastActivity ||
        "",
      description: `${detectedDrones.length} active targets detected`,
      icon: <Radar />,
    },
    {
      id: "threat-assessment",
      title: "Threat Assessment",
      lastActivity:
        floatingCards.find((c) => c.id === "threat-assessment")?.lastActivity ||
        "",
      description: activeThreat
        ? `Critical threat: ${activeThreat.id}`
        : "No active threats",
      icon: <Assessment />,
    },
    {
      id: "spectrum-analyzer",
      title: "Spectrum Analyzer",
      lastActivity:
        floatingCards.find((c) => c.id === "spectrum-analyzer")?.lastActivity || "",
      description: "Full spectrum analyzer with waterfall",
      icon: <Analytics />,
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <div className="App">
        {/* Main Container */}
        <div className="main-container">
          {/* Application Header */}
          <div className="app-header">
            <div className="header_data"><h2>RAPIDEV</h2></div>
            <div className="header_data">
              <Typography variant="h5" className="app-title">
                ANTI-DRONE-SYSTEM
              </Typography>
            </div>
            <div className="header_data">
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
          </div>

          {/* Drag overlay - shows when dragging spectrum analyzer */}
          {isDraggingOver && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 255, 65, 0.05)",
                border: "3px dashed rgba(0, 255, 65, 0.5)",
                zIndex: 9998,
                pointerEvents: "none",
              }}
            >
              {/* Drag cursor */}
              <Box
                sx={{
                  position: "absolute",
                  left: dragPosition.x - 40,
                  top: dragPosition.y - 40,
                  width: 80,
                  height: 80,
                  backgroundColor: "rgba(0, 255, 65, 0.2)",
                  border: "2px solid var(--primary-color)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 1s infinite",
                  "@keyframes pulse": {
                    "0%": {
                      transform: "scale(1)",
                      opacity: 0.7
                    },
                    "50%": {
                      transform: "scale(1.1)",
                      opacity: 1
                    },
                    "100%": {
                      transform: "scale(1)",
                      opacity: 0.7
                    }
                  }
                }}
              >
                <Typography
                  sx={{
                    color: "var(--primary-color)",
                    fontSize: "30px",
                    fontWeight: "bold",
                  }}
                >
                  📡
                </Typography>
              </Box>

              {/* Drop hint in the center */}
              {showDropHint && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "2px solid var(--primary-color)",
                    borderRadius: "8px",
                    padding: "20px 40px",
                    textAlign: "center",
                    minWidth: "300px",
                    boxShadow: "0 0 20px rgba(0, 255, 65, 0.5)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "var(--primary-color)",
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: "18px",
                      fontWeight: "bold",
                      mb: 1,
                    }}
                  >
                    Drop Spectrum Analyzer Here
                  </Typography>
                  <Typography
                    sx={{
                      color: "#aaa",
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: "12px",
                    }}
                  >
                    Release to create a floating spectrum analyzer
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Full Screen Map */}
          <div className="map-container">
            <CesiumMap
              drones={detectedDrones}
              systemActive={check}
              drawingToolsEnabled={drawingToolsEnabled}
              coneangle={coneAngle}
              coneelevation={coneElevation}
              jammerStatus={jammerStatus}
            />
          </div>

          {/* Floating Spectrum Analyzer (when dragged from spectrum tab) */}
          {floatingSpectrum.visible && (
            <div style={{
              position: 'fixed',
              zIndex: 9999,
              pointerEvents: 'auto'
            }}>
              <FloatingSpectrumAnalyzer
                spectrumData={fft.length > 0 ? fft : Array(2048).fill(-80)}
                width={400}
                height={250}
                onClose={() => {
                  // console.log("Closing floating spectrum");
                  setFloatingSpectrum(prev => ({ ...prev, visible: false }));
                }}
                initialPosition={floatingSpectrum.position}
                settings={floatingSpectrum.settings}
              />
            </div>
          )}

          {/* Floating Cards */}
          {floatingCards
            .filter((card) => card.visible)
            .map((card) => (
              <Box
                key={card.id}
                data-card-id={card.id}
                className={`floating-card ${
                  card.minimized ? "floating-card-minimized" : ""
                }`}
                sx={{
                  left: card.position.x,
                  top: card.position.y,
                }}
              >
                {/* Header with drag handlers */}
                <Box 
                  className="floating-card-header"
                  onMouseDown={(e) => handleMouseDown(e, card.id)}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "var(--primary-color)" }}>
                    {card.title}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCard(card.id);
                      }}
                      sx={{ color: "#ff4444", p: 0.5, ml: 0.5 }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
                {/* Content area */}
                <Box className="floating-card-content">
                  {renderCardContent(card)}
                </Box>
              </Box>
            ))}

          {/* Left Fixed Column */}
          <div className="fixed-column">
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