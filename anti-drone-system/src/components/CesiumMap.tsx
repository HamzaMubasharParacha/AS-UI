import React, { useRef, useEffect, useState } from "react";
import { Box, Typography, FormControlLabel, Checkbox, Button, Snackbar, Alert, TextField, Slider } from "@mui/material";
import { MapContainer, Circle, Marker, Popup, useMap, Polyline, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapDrawingTools from "./MapDrawingTools";
import { createESRISatelliteOfflineLayer } from "../utils/OfflineTileLayer";
import OfflineMapControl from "./OfflineMapControl";
import { command_center } from "../api/config";
import RadarComponent from "./RadarComponent";
import MiniSpectrumAnalyzer from './MiniSpectrumAnalyzer';
import CircularSlider from '@fseehawer/react-circular-slider';
// Compass Component
const Compass: React.FC<{
  direction: number;
  size?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ direction, size = 80, position = 'bottom-left' }) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 10, left: 10 };
      case 'top-right':
        return { top: 10, right: 10 };
      case 'bottom-left':
        return { bottom: 20, left: 10 };
      case 'bottom-right':
        return { bottom: 10, right: 10 };
      default:
        return { top: 10, right: 10 };
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        ...getPositionStyles(),
        width: size,
        height: size,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        borderRadius: "50%",
        border: "2px solid #00ff41",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Compass Outer Circle */}
      <Box
        sx={{
          position: "relative",
          width: size - 20,
          height: size - 20,
          borderRadius: "50%",
          border: "1px solid #00ff41",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Direction Letters */}
        <Typography
          sx={{
            position: "absolute",
            top: 2,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#00ff41",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          N
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#00ff41",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          S
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            left: 2,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#00ff41",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          W
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            right: 2,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#00ff41",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          E
        </Typography>

        {/* Compass Needle */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            transform: `rotate(${direction}deg)`,
            transition: "transform 0.3s ease",
          }}
        >
          {/* North Pointer */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 2,
              height: "40%",
              backgroundColor: "#ff0000",
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "8px solid #ff0000",
              },
            }}
          />

          {/* South Pointer */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 2,
              height: "40%",
              backgroundColor: "#00ff41",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "8px solid #00ff41",
              },
            }}
          />

          {/* Center Dot */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 8,
              height: 8,
              backgroundColor: "#00ff41",
              borderRadius: "50%",
              border: "1px solid #fff",
            }}
          />
        </Box>

        {/* Direction Display */}
        <Box
          sx={{
            position: "absolute",
            bottom: -25,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "#00ff41",
            padding: "2px 8px",
            borderRadius: 2,
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: "bold",
            border: "1px solid #00ff41",
            whiteSpace: "nowrap",
          }}
        >
          {direction}°
        </Box>
      </Box>
    </Box>
  );
};

// Triangle Cone Component with Circular Edges
const TriangleCone: React.FC<{
  center: [number, number];
  angle: number;
  radius: number;
  direction?: number;
  jammerActive?: boolean;
}> = ({ center, angle = 45, radius = 10000, direction = 0, jammerActive = false }) => {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const getConePoints = (): [number, number][] => {
    const [centerLat, centerLng] = center;
    const radiusInDegrees = radius / 111320;
    const leftAngle = direction - angle / 2;
    const rightAngle = direction + angle / 2;
    const points: [number, number][] = [];

    points.push(center);

    const arcSteps = 20;
    for (let i = 0; i <= arcSteps; i++) {
      const currentAngle = leftAngle + (i / arcSteps) * angle;
      const point: [number, number] = [
        centerLat + radiusInDegrees * Math.cos(toRadians(currentAngle)),
        centerLng + radiusInDegrees * Math.sin(toRadians(currentAngle)) / Math.cos(toRadians(centerLat))
      ];
      points.push(point);
    }

    points.push(center);
    return points;
  };

  // Determine colors based on jammer status
  const getConeColors = () => {
    if (jammerActive) {
      return {
        color: "#FF0000",
        fillColor: "#FF0000",
        fillOpacity: 0.25,
        weight: 3,
        dashArray: "3, 6",
      };
    } else {
      return {
        color: "#FFD700",
        fillColor: "#FFD700",
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "5, 5",
      };
    }
  };

  const coneColors = getConeColors();

  return (
    <Polygon
      positions={getConePoints()}
      pathOptions={coneColors}
    >
      <Popup>
        <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
          <strong>▲ {jammerActive ? "JAMMING CONE" : "RADAR CONE"}</strong>
          <br />
          <strong>ANGLE:</strong> {angle}°
          <br />
          <strong>RADIUS:</strong> {(radius / 1000).toFixed(1)}km
          <br />
          <strong>DIRECTION:</strong> {direction}°
          <br />
          <strong>STATUS:</strong> {jammerActive ?
            <span style={{ color: "#FF0000", fontWeight: "bold" }}>JAMMING ACTIVE</span> :
            <span style={{ color: "#FFD700" }}>MONITORING</span>}
          <br />
          <strong>RF TRANSMISSION:</strong> {jammerActive ?
            <span style={{ color: "#FF0000", fontWeight: "bold" }}>ON</span> :
            <span style={{ color: "#00ff41" }}>OFF</span>}
          {jammerActive && (
            <>
              <br />
              <strong style={{ color: "#FF0000" }}>WARNING: RF RADIATION ACTIVE</strong>
            </>
          )}
        </div>
      </Popup>
    </Polygon>
  );
};

interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}

interface TrajectoryPoint {
  position: [number, number, number];
  timestamp: string;
  speed: number;
  heading: number;
}

interface DroneTrajectory {
  id: string;
  points: TrajectoryPoint[];
  color: string;
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface CesiumMapProps {
  drones: DroneData[];
  systemActive: boolean;
  drawingToolsEnabled?: boolean;
  coneangle: number;
  coneelevation: number;
}

// Custom component to add offline tile layer
const OfflineTileLayerComponent: React.FC<{ offlineFirst: boolean }> = ({
  offlineFirst,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const offlineLayer = createESRISatelliteOfflineLayer({
      offlineFirst: offlineFirst,
    });

    offlineLayer.addTo(map);

    return () => {
      if (map.hasLayer(offlineLayer)) {
        map.removeLayer(offlineLayer);
      }
    };
  }, [map, offlineFirst]);

  return null;
};

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom command center icon
const commandCenterIcon = new L.DivIcon({
  html: `
    <div style="
      background: rgba(0, 230, 118, 0.95);
      color: #000;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      border: 4px solid #fff;
      box-shadow: 0 6px 20px rgba(0,0,0,0.6);
    ">🏢</div>
  `,
  className: "command-center-icon",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Create drone icons based on threat level with enhanced detection highlighting
const createDroneIcon = (
  threatLevel: string,
  isDetected: boolean,
  distance: number
) => {
  const colors = {
    LOW: "#4CAF50",
    MEDIUM: "#FF9800",
    HIGH: "#F44336",
    CRITICAL: "#D32F2F",
  };

  const droneEmojis = {
    LOW: "🛩️",
    MEDIUM: "🚁",
    HIGH: "✈️",
    CRITICAL: "🚀",
  };

  const pulseAnimation = isDetected
    ? `
    animation: pulse 1.5s infinite;
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 ${colors[threatLevel as keyof typeof colors]
    }66; }
      50% { transform: scale(1.1); box-shadow: 0 0 0 10px ${colors[threatLevel as keyof typeof colors]
    }00; }
      100% { transform: scale(1); box-shadow: 0 0 0 0 ${colors[threatLevel as keyof typeof colors]
    }00; }
    }
  `
    : "";

  const detectionRing = isDetected
    ? `
    <div style="
      position: absolute;
      top: -5px;
      left: -5px;
      width: 40px;
      height: 40px;
      border: 2px solid ${colors[threatLevel as keyof typeof colors]};
      border-radius: 50%;
      animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    "></div>
    <style>
      @keyframes ping {
        75%, 100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    </style>
  `
    : "";

  return new L.DivIcon({
    html: `
      <div style="position: relative;">
        ${detectionRing}
        <div style="
          background: ${colors[threatLevel as keyof typeof colors]};
          color: #fff;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: ${isDetected ? "3px solid #fff" : "2px solid #fff"};
          box-shadow: ${isDetected
        ? `0 0 20px ${colors[threatLevel as keyof typeof colors]}`
        : "0 4px 12px rgba(0,0,0,0.4)"
      };
          ${pulseAnimation}
        ">${droneEmojis[threatLevel as keyof typeof droneEmojis]}</div>
        ${isDetected
        ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff0000;
            color: #fff;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            border: 1px solid #fff;
            animation: blink 1s infinite;
          ">!</div>
          <style>
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          </style>
        `
        : ""
      }
      </div>
    `,
    className: `drone-icon ${isDetected ? "detected" : ""}`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Calculate distance between two coordinates in meters
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Get trajectory color based on threat level
const getTrajectoryColor = (threatLevel: string): string => {
  const colors = {
    LOW: "#4CAF50",
    MEDIUM: "#FF9800",
    HIGH: "#F44336",
    CRITICAL: "#D32F2F",
  };
  return colors[threatLevel as keyof typeof colors];
};

const CesiumMap: React.FC<CesiumMapProps> = ({
  drones,
  systemActive,
  drawingToolsEnabled = false,
  coneangle,
  coneelevation,
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [radarActive, setRadarActive] = useState(true);
  const [detectedThreats, setDetectedThreats] = useState<string[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<DroneData | null>(null);
  const [offlineMode, setOfflineMode] = useState(true);
  const [showOfflineControl, setShowOfflineControl] = useState(false);
  const [trajectories, setTrajectories] = useState<DroneTrajectory[]>([]);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showTriangleCone, setShowTriangleCone] = useState(true);

  // Jammer state management
  const [jammerStatus, setJammerStatus] = useState<'idle' | 'starting' | 'active' | 'stopping'>('idle');
  const [selectedFrequencies, setSelectedFrequencies] = useState<Record<string, boolean>>({
    "5.8GHz": false,
    "5.2GHz": false,
    "4.0GHz": false,
    "2.4GHz": false,
    "1.4GHz": false,
    "<1GHz": false,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

 

  // Updated coordinates as requested by user (Islamabad/Rawalpindi area)
  const [latLon, setLatLon] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });
  const centerLat = latLon.lat ?? 33.6464;
  const centerLng = latLon.lon ?? 72.999;
  const centerPosition: [number, number] = [centerLat, centerLng];
  const radius10km = 10000;
  const coneRadius = 5000;
  const [showPtzControls, setShowPtzControls] = useState(false); // true = shown, false = hidden

  // Enhanced getToken function with fallback
  const getToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Authentication token not found. Please login again.',
        severity: 'error'
      });
      throw new Error('No authentication token');
    }
    return token;
  };

  // Jammer cone direction with token authentication


  // Get coordinate of command center
  const getCoordinate = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${command_center}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed for command center data');
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.data.length > 0) {
        const firstSensor = data.data[0];
        const config = JSON.parse(firstSensor.config);
        setLatLon({
          lat: config.geo_location.lat,
          lon: config.geo_location.lng,
        });
      }
    } catch (error) {
      console.log("Error fetching command center data:", error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        setSnackbar({
          open: true,
          message: error.message,
          severity: 'error'
        });
      }
    }
  };

  useEffect(() => {
    getCoordinate();
    const intervalId = setInterval(getCoordinate, 100000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  // Update trajectories when drones data changes
  useEffect(() => {
    if (drones.length === 0) return;

    setTrajectories(prevTrajectories => {
      const updatedTrajectories = [...prevTrajectories];

      drones.forEach(drone => {
        const existingTrajectoryIndex = updatedTrajectories.findIndex(t => t.id === drone.id);

        const newPoint: TrajectoryPoint = {
          position: drone.position,
          timestamp: drone.detected_at,
          speed: drone.speed,
          heading: drone.heading,
        };

        if (existingTrajectoryIndex !== -1) {
          const existingPoints = updatedTrajectories[existingTrajectoryIndex].points;
          const lastPoint = existingPoints[existingPoints.length - 1];

          const distanceChange = calculateDistance(
            lastPoint.position[1],
            lastPoint.position[0],
            drone.position[1],
            drone.position[0]
          );

          if (distanceChange > 10) {
            updatedTrajectories[existingTrajectoryIndex].points = [
              ...existingPoints.slice(-99),
              newPoint,
            ];
          }
        } else {
          updatedTrajectories.push({
            id: drone.id,
            points: [newPoint],
            color: getTrajectoryColor(drone.threat_level),
            threat_level: drone.threat_level,
          });
        }
      });

      const now = new Date().getTime();
      return updatedTrajectories.filter((trajectory) => {
        const lastPointTime = new Date(
          trajectory.points[trajectory.points.length - 1].timestamp
        ).getTime();
        return (
          drones.find((d) => d.id === trajectory.id) ||
          now - lastPointTime < 5 * 60 * 1000
        );
      });
    });
  }, [drones]);

  // Threat detection logic
  useEffect(() => {
    if (radarActive && systemActive) {
      const detected: string[] = [];
      drones.forEach((drone) => {
        const distance = calculateDistance(
          centerLat,
          centerLng,
          drone.position[1],
          drone.position[0]
        );
        if (distance <= radius10km) {
          detected.push(drone.id);
        }
      });
      setDetectedThreats(detected);
    } else {
      setDetectedThreats([]);
    }
  }, [drones, radarActive, systemActive, centerLat, centerLng, radius10km]);

  // Single toggle function for jammer
  const toggleJammer = async () => {
    if (jammerStatus === 'starting' || jammerStatus === 'stopping') return;

    const isStarting = jammerStatus !== 'active';

    if (isStarting) {
      // Starting jammer
      setJammerStatus('starting');

      try {
        const token = getToken();

        // Get selected frequencies from checkboxes
        const activeFrequencies = Object.keys(selectedFrequencies).filter(
          freq => selectedFrequencies[freq]
        );

        if (activeFrequencies.length === 0) {
          setSnackbar({
            open: true,
            message: 'Please select at least one frequency band',
            severity: 'warning'
          });
          setJammerStatus('idle');
          return;
        }

        // Frequency priority order
        const frequencyPriority = ["5.8GHz", "5.2GHz", "2.4GHz", "4GHz", "1.5GHz", "<1GHz"];

        // Find the highest priority selected frequency
        const primaryFrequency = frequencyPriority.find(freq =>
          activeFrequencies.includes(freq)
        ) || activeFrequencies[0];

        const requestBody = {
          frequencyBand: primaryFrequency,
          powerAttenuation: 18,
          allSelectedBands: activeFrequencies
        };

        console.log('Starting jammer with frequencies:', {
          primary: primaryFrequency,
          all: activeFrequencies
        });

        const response = await fetch("http://192.168.100.102:8080/api/jammer/1/jam/start",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setJammerStatus('active');
          setSnackbar({
            open: true,
            message: `Jamming started on ${primaryFrequency}${activeFrequencies.length > 1 ? ` (${activeFrequencies.length} bands selected)` : ''}`,
            severity: 'success'
          });
        } else {
          throw new Error(data.message || 'Failed to start jamming');
        }
      } catch (error) {
        console.error("Error starting jammer:", error);
        setJammerStatus('idle');
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : 'Failed to start jamming',
          severity: 'error'
        });
      }
    } else {
      // Stopping jammer
      setJammerStatus('stopping');

      try {
        const token = getToken();

        const response = await fetch(
          "http://192.168.100.102:8080/api/jammer/1/jam/stop",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setJammerStatus('idle');
          setSnackbar({
            open: true,
            message: data.message || 'Jamming stopped successfully',
            severity: 'success'
          });
        } else {
          throw new Error(data.message || 'Failed to stop jamming');
        }
      } catch (error) {
        console.error("Error stopping jammer:", error);
        setJammerStatus('active');
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : 'Failed to stop jamming',
          severity: 'error'
        });
      }
    }
  };

  const handleFrequencyChange = (frequency: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFrequencies(prev => ({
      ...prev,
      [frequency]: event.target.checked
    }));
  };

  // Add these state variables
  const [azimuthValue, setAzimuthValue] = useState("0");
  const [elevationValue, setElevationValue] = useState("0");

  // Single function to set both azimuth and elevation
  const setAntennaPosition = async (type: 'azimuth' | 'elevation', value: number) => {
    try {
      const token = getToken();

      // Prepare the request body based on your API structure
      const requestBody = {
        command_type: "PTZ_CONTROL",
        ptz_azimuth: type === 'azimuth' ? value : parseFloat(azimuthValue),
        ptz_elevation: type === 'elevation' ? value : parseFloat(elevationValue)
      };

      const response = await fetch(
        "http://192.168.100.102:8080/api/jammer/1/command",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: `${type === 'azimuth' ? 'Azimuth' : 'Elevation'} set to ${value}°`,
          severity: 'success'
        });

        // Update the local state
        if (type === 'azimuth') {
          setAzimuthValue(value.toString());
        } else {
          setElevationValue(value.toString());
        }
      } else {
        throw new Error(data.message || `Failed to set ${type}`);
      }
    } catch (error) {
      console.error(`Error setting ${type}:`, error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : `Failed to set ${type}`,
        severity: 'error'
      });
    }
  };

  // Individual handlers for azimuth and elevation
  const setAzimuth = () => {
    const azimuth = parseFloat(azimuthValue);
    if (isNaN(azimuth) || azimuth < 0 || azimuth > 360) {
      setSnackbar({
        open: true,
        message: 'Azimuth must be between 0° and 360°',
        severity: 'warning'
      });
      return;
    }
    setAntennaPosition('azimuth', azimuth);
  };

  const setElevation = () => {
    const elevation = parseFloat(elevationValue);
    if (isNaN(elevation) || elevation < -80 || elevation > 15) {
      setSnackbar({
        open: true,
        message: 'Elevation must be between -90° and +90°',
        severity: 'warning'
      });
      return;
    }
    setAntennaPosition('elevation', elevation);
  };

  const toggleRadar = () => {
    setRadarActive(!radarActive);
  };

  const toggleTrajectories = () => {
    setShowTrajectories(!showTrajectories);
  };

  const toggleTriangleCone = () => {
    setShowTriangleCone(!showTriangleCone);
  };

  const handleThreatClick = (drone: DroneData) => {
    setSelectedThreat(drone);
  };

  const closeThreatDetails = () => {
    setSelectedThreat(null);
  };

  const clearTrajectories = () => {
    setTrajectories([]);
  };

  const getTrajectoryPoints = (
    trajectory: DroneTrajectory
  ): [number, number][] => {
    return trajectory.points.map((point) => [
      point.position[1],
      point.position[0],
    ]);
  };

  // Get count of selected frequencies
  const selectedFrequencyCount = Object.values(selectedFrequencies).filter(Boolean).length;

  // Determine button text and state based on jammer status
  const getJammerButtonConfig = () => {
    switch (jammerStatus) {
      case 'active':
        return {
          text: 'STOP JAMMING',
          color: '#ff4444',
          backgroundColor: '#ff4444',
          hoverColor: '#cc3333',
          disabled: false
        };
      case 'starting':
        return {
          text: 'STARTING...',
          color: '#ffaa00',
          backgroundColor: '#ffaa00',
          hoverColor: '#ffaa00',
          disabled: true
        };
      case 'stopping':
        return {
          text: 'STOPPING...',
          color: '#ffaa00',
          backgroundColor: '#ffaa00',
          hoverColor: '#ffaa00',
          disabled: true
        };
      default:
        return {
          text: 'START JAMMING',
          color: '#00ff41',
          backgroundColor: 'rgba(0, 255, 65, 0.3)',
          hoverColor: '#00ff41',
          disabled: selectedFrequencyCount === 0
        };
    }
  };

  const jammerButtonConfig = getJammerButtonConfig();

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: {
          xs: "calc(100vh - 45px)",
          sm: "calc(100vh - 50px)",
          md: "calc(100vh - 60px)",
        },
        overflow: "hidden",
      }}
    >
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: "5vh" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Compass Component */}
      <Compass
        direction={0}
        size={100}
        position="bottom-left"
      />

      {/* Leaflet Map with Satellite Imagery */}
      <MapContainer
        center={centerPosition}
        zoomControl={false}
        zoom={12}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "8px",
          border: "2px solid #00ff41",
        }}
        
      >
        {/* Offline Tile Layer */}
        <OfflineTileLayerComponent offlineFirst={offlineMode} />

        {/* Triangle Cone - Changes color based on jammer status */}
        {showTriangleCone && (
          <TriangleCone
            center={centerPosition}
            angle={45}
            radius={coneRadius}
            direction={coneangle}
            jammerActive={jammerStatus === 'active'}
          />
        )}

        {/* Drone Trajectories */}
        {showTrajectories && trajectories.map(trajectory => (
          <Polyline
            key={trajectory.id}
            positions={getTrajectoryPoints(trajectory)}
            pathOptions={{
              color: trajectory.color,
              weight: 3,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: trajectory.threat_level === 'CRITICAL' ? '5, 10' : '10, 10',
              dashOffset: '0'
            }}
            eventHandlers={{
              click: () => {
                const drone = drones.find(d => d.id === trajectory.id);
                if (drone) {
                  handleThreatClick(drone);
                }
              }
            }}
          />
        ))}

        {/* GEOGRAPHICALLY FIXED 10km Coverage Circle */}
        <Circle
          center={centerPosition}
          radius={radius10km}
          pathOptions={{
            color: "#00E676",
            fillColor: "#00E676",
            fillOpacity: 0.1,
            weight: 2,
            dashArray: "5, 8",
          }}
        />

        <RadarComponent center={centerPosition} radius={radius10km} radarActive={radarActive} systemActive={systemActive} />

        {/* GEOGRAPHICALLY FIXED Command Center Marker */}


        {/* Drone Markers */}
        {drones.map((drone) => {
          const isDetected = detectedThreats.includes(drone.id);
          const actualDistance = calculateDistance(
            centerLat,
            centerLng,
            drone.position[1],
            drone.position[0]
          );
          const trajectory = trajectories.find(t => t.id === drone.id);

          return (
            <Marker
              key={drone.id}
              position={[drone.position[1], drone.position[0]]}
              icon={createDroneIcon(
                drone.threat_level,
                isDetected,
                actualDistance
              )}
             
            >
              <Popup>
                <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
                  <strong style={{ color: isDetected ? "#ff0000" : "#333" }}>
                    {isDetected ? "🚨 DETECTED THREAT" : "🎯 DRONE"}
                  </strong>
                  <br />
                  <strong>ID:</strong> {drone.id}
                  <br />
                  <strong>THREAT LEVEL:</strong>{" "}
                  <span
                    style={{
                      color:
                        drone.threat_level === "LOW"
                          ? "#4CAF50"
                          : drone.threat_level === "MEDIUM"
                            ? "#FF9800"
                            : drone.threat_level === "HIGH"
                              ? "#F44336"
                              : "#D32F2F",
                    }}
                  >
                    {drone.threat_level}
                  </span>
                  <br />
                  <strong>DISTANCE:</strong> {actualDistance.toFixed(0)}m<br />
                  <strong>SPEED:</strong> {drone.speed.toFixed(1)}km/h
                  <br />
                  <strong>HEADING:</strong> {drone.heading}°<br />
                  <strong>LAT:</strong> {drone.position[1].toFixed(4)}
                  <br />
                  <strong>LNG:</strong> {drone.position[0].toFixed(4)}
                  <br />
                  <strong>DETECTED:</strong> {drone.detected_at}
                  <br />
                  {trajectory && (
                    <>
                      <strong>TRAJECTORY POINTS:</strong>{" "}
                      {trajectory.points.length}
                      <br />
                    </>
                  )}
                  <br />
                  {/* {isDetected && (
                    <>
                      <strong style={{ color: "#ff0000" }}>STATUS:</strong>{" "}
                      <span style={{ color: "#ff0000" }}>IN RADAR RANGE</span>
                      <br />
                      <strong style={{ color: "#ff0000" }}>ALERT:</strong>{" "}
                      <span style={{ color: "#ff0000" }}>ACTIVE TRACKING</span>
                    </>
                  )} */}
                </div>
              </Popup>
            </Marker>
          );
        })}
          
        {/* Map Drawing Tools */}
        {drawingToolsEnabled && <MapDrawingTools />}
      </MapContainer>

      {/* Jammer Control Panel */}
      {/* Jammer Control Panel */}
      <Box
        sx={{
          position: "absolute",
          bottom: 10,
          right: 10,
          backgroundColor: "rgba(0,0,0,0.4)",
          color: "#fff",
          padding: 2,
          borderRadius: 2,
          fontFamily: "monospace",
          fontSize: "11px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          border: `1px solid ${jammerStatus === 'active' ? '#ff4444' :
            jammerStatus === 'starting' ? '#ffaa00' :
              jammerStatus === 'stopping' ? '#ffaa00' : '#00ff41'
            }`,
          zIndex: 1000,
          minWidth: 200,
        }}
      >
        {/* Jammer Status */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography
            variant="subtitle2"
            sx={{
              color:
                jammerStatus === 'active' ? '#ff4444' :
                  jammerStatus === 'starting' ? '#ffaa00' :
                    jammerStatus === 'stopping' ? '#ffaa00' : '#00ff41',
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            {jammerStatus === 'active' ? '🟢 JAMMER ACTIVE' :
              jammerStatus === 'starting' ? '🟡 STARTING...' :
                jammerStatus === 'stopping' ? '🟡 STOPPING...' : 'JAMMER IDLE 🔴'}
          </Typography>
        </Box>

        {/* Checkboxes Section */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "#00ff41",
              mb: 1,
              fontWeight: "bold",
              fontSize: "12px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            JAMMING BANDS
          </Typography>

         <Box sx={{ display: "flex", flexDirection: "row", gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
  {Object.keys(selectedFrequencies).map((frequency) => (
    <Box 
      key={frequency}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: "4px",
        minWidth: "40px",
        '&:hover': {
          backgroundColor: "rgba(0, 255, 65, 0.1)",
          borderRadius: 1,
        },
      }}
    >
      {/* Frequency text above */}
      <Typography 
        sx={{
          fontSize: "10px",
          fontFamily: "monospace",
          color: (jammerStatus === 'active' || jammerStatus === 'starting' || jammerStatus === 'stopping') 
            ? 'rgba(255, 255, 255, 0.7)' 
            : '#fff',
          mb: 0.5,
          textAlign: 'center'
        }}
      >
        {frequency}
      </Typography>
      
      {/* Checkbox below */}
      <Checkbox
        size="small"
        checked={selectedFrequencies[frequency]}
        onChange={handleFrequencyChange(frequency)}
        disabled={jammerStatus === 'active' || jammerStatus === 'starting' || jammerStatus === 'stopping'}
        sx={{
          color: "#00ff41",
          '&.Mui-checked': {
            color: "#00ff41",
          },
          '&.Mui-disabled': {
            color: 'rgba(0, 255, 65, 0.5)',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 14,
          },
          padding: "2px",
        }}
      />
    </Box>
  ))}
</Box>
        </Box>
        {/* Single Toggle Button */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Button
            variant="contained"
            size="medium"
            onClick={toggleJammer}
            disabled={jammerButtonConfig.disabled}
            sx={{
              backgroundColor: jammerButtonConfig.backgroundColor,
              color: jammerStatus === 'active' ? "#fff" : "#000",
              fontSize: "11px",
              padding: "6px 20px",
              fontFamily: "monospace",
              textTransform: "none",
              fontWeight: "bold",
              minWidth: "140px",
              '&:hover': {
                backgroundColor: jammerButtonConfig.hoverColor,
                boxShadow: `0 0 8px ${jammerButtonConfig.hoverColor}66`,
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(128, 128, 128, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {jammerButtonConfig.text}
          </Button>
        </Box>
           <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 1 }}>
  <Typography
    variant="subtitle2"
    sx={{
      color: "#00ff41",
      fontWeight: "bold",
      fontSize: "12px",
      mr: 1,
    }}
  >
    PTZ CONTROLS
  </Typography>
  
  {/* Toggle Button for PTZ Controls */}
  <Button
    variant="text"
    size="small"
    onClick={() => setShowPtzControls(!showPtzControls)}
    sx={{
      minWidth: "30px",
      minHeight: "30px",
      padding: "4px",
      color: "#00ff41",
      fontSize: "14px",
      fontFamily: "monospace",
      '&:hover': {
        backgroundColor: 'rgba(0, 255, 65, 0.1)',
      }
    }}
  >
    {showPtzControls ? '▼' : '▲'}
  </Button>
</Box>

{/* Azimuth and Elevation Controls */}
<Box sx={{ display: showPtzControls ? "block" : "none", }}>
  {/* Current Position Display */}
  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5, fontSize: "10px" }}>
    <Typography sx={{ color: "#00ff41", fontSize: "10px" }}>
      Current: Az {coneangle}° El {coneelevation}°
    </Typography>
  </Box>

  {/* Combined Azimuth and Elevation Controls */}
  <Box sx={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
    mb: 2
  }}>
    {/* Circular Slider for Azimuth */}
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      width: "180px",
      height: "180px"
    }}>
      <Box sx={{
        position: "relative",
        width: "150px",
        height: "150px"
      }}>
        <CircularSlider
          width={150}
          knobColor="#00ff41"
          knobSize={25}
          progressColorFrom="rgba(12, 62, 22, 0.1)"
          progressColorTo="rgba(12, 62, 22, 0.1)"
          progressSize={6}
          trackColor="rgba(0, 255, 65, 0.2)"
          trackSize={6}
          min={0}
          max={360}
          label="" // Empty string to hide the label
          labelColor="#00ff41"
          labelBottom={true}
          labelFontSize="0px" // Set to 0
          valueFontSize="0px" // Set to 0 to hide value
          verticalOffset="10px"
          onChange={(value) => {
            const numValue = value as number;
            setAzimuthValue(numValue.toString());
            setAntennaPosition('azimuth',numValue);
          }}
        />

        {/* SVG Overlay for Markings */}
        <svg
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {/* Major markings at cardinal directions */}
          {[
            { angle: 0, value: "0°" },
            { angle: 45, value: "45°" },
            { angle: 90, value: "90°" },
            { angle: 135, value: "135°" },
            { angle: 180, value: "180°" },
            { angle: 225, value: "225°" },
            { angle: 270, value: "270°" },
            { angle: 315, value: "315°" },
          ].map(({ angle, value }) => {
            const rad = ((angle - 90) * Math.PI) / 180; // Offset by -90°
            const radius = 75;
            const center = 75;

            return (
              <g key={angle}>
                {/* Mark line */}
                <line
                  x1={center + (radius - 12) * Math.cos(rad)}
                  y1={center + (radius - 12) * Math.sin(rad)}
                  x2={center + (radius + 5) * Math.cos(rad)}
                  y2={center + (radius + 5) * Math.sin(rad)}
                  stroke="#00ff41"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Angle label */}
                <text
                  x={center + (radius - 25) * Math.cos(rad)}
                  y={center + (radius - 25) * Math.sin(rad)}
                  fill="#00ff41"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Minor markings (every 5 degrees) */}
          {Array.from({ length: 72 }, (_, i) => i * 5).map((angle) => {
            if (angle % 45 === 0) return null; // Skip major markings

            const rad = ((angle - 90) * Math.PI) / 180;
            const radius = 75;
            const center = 75;
            const markLength = angle % 15 === 0 ? 6 : 3; // Longer marks every 15°

            return (
              <line
                key={`minor-${angle}`}
                x1={center + (radius - 8) * Math.cos(rad)}
                y1={center + (radius - 8) * Math.sin(rad)}
                x2={center + (radius - 8 + markLength) * Math.cos(rad)}
                y2={center + (radius - 8 + markLength) * Math.sin(rad)}
                stroke="#00ff41"
                strokeWidth="1"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </Box>

      <Typography
        sx={{
          color: '#00ff41',
          fontSize: '12px',
          fontFamily: 'monospace',
          mt: 1,
          fontWeight: 'bold'
        }}
      >
        Azimuth: {azimuthValue}°
      </Typography>

    </Box>

    {/* Vertical Slider for Elevation */}
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      width: "120px",
      height: "180px"
    }}>
      <Box sx={{
        position: "relative",
        height: "150px",
        width: "100px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <Slider
          orientation="vertical"
          min={-80}
          max={15}
          value={parseFloat(elevationValue) || 0}
          onChange={(event, value) => {
            const numValue = value as number;
            setElevationValue(numValue.toString());
            setAntennaPosition('elevation',numValue);
          }}
          marks={[
            { value: -80, label: '-80°' },
            { value: -60, label: '-60°' },
            { value: -45, label: '-45°' },
            { value: -30, label: '-30°' },
            { value: -15, label: '-15°' },
            { value: 0, label: '0°' },
            { value: 10, label: '10°' },
            { value: 15, label: '15' },
          ]}
          valueLabelDisplay="auto"
          sx={{
            color: '#00ff41',
            height: '140px',
            '& .MuiSlider-track': {
              background: 'linear-gradient(to top, #11461d, #11461d)',
              border: 'none',
              width: '4px',
              left: 'calc(50% - 2px)',
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'rgba(0, 255, 65, 0.2)',
              width: '4px',
              left: 'calc(50% - 2px)',
            },
            '& .MuiSlider-thumb': {
              backgroundColor: '#00ff41',
              width: 20,
              height: 20,
              border: '2px solid #000',
              boxShadow: '0 0 10px rgba(0, 255, 65, 0.8)',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0 0 15px rgba(0, 255, 65, 1)',
              },
              '&.Mui-active': {
                boxShadow: '0 0 20px rgba(0, 255, 65, 1)',
              },
            },
            '& .MuiSlider-mark': {
              backgroundColor: '#00ff41',
              width: '8px',
              height: '2px',
              borderRadius: '0',
              left: 'calc(50% - 4px)',
            },
            '& .MuiSlider-markLabel': {
              color: '#00ff41',
              fontSize: '9px',
              fontFamily: 'monospace',
              left: '30px',
              right: 'auto',
            },
            '& .MuiSlider-valueLabel': {
              backgroundColor: '#00ff41',
              color: '#000',
              fontFamily: 'monospace',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '4px',
              '&::before': {
                display: 'none',
              },
            },
          }}
        />

        {/* Vertical scale background */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          height: '100%',
          width: '1px',
          backgroundColor: 'rgba(0, 255, 65, 0.3)',
          zIndex: -1
        }} />
      </Box>

      <Typography
        sx={{
          color: '#00ff41',
          fontSize: '12px',
          fontFamily: 'monospace',
          mt: 1,
          fontWeight: 'bold'
        }}
      >
        Elevation: {elevationValue}°
      </Typography>

    </Box>
  </Box>
</Box>
      </Box>
      {/* <Box
      sx={{
        position: "absolute",
        bottom: 270, // Position it above the jammer controls (10 + 160 height)
        right: 5,
        zIndex: 1000,
      }}
    >
      <MiniSpectrumAnalyzer 
        width={300}
        height={150}
        frequencyRange={[20, 6000]}
        amplitudeRange={[-120, 0]}
        showGrid={true}
        showLabels={true}
        updateInterval={100}
      />
    </Box> */}

      {/* Rest of the component remains the same... */}
      {/* Detailed Threat Information Panel */}
      {selectedThreat && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            color: "#00ff41",
            padding: 3,
            borderRadius: 3,
            fontFamily: "monospace",
            fontSize: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
            border: "2px solid #ff0000",
            zIndex: 2000,
            minWidth: "400px",
            maxWidth: "500px",
          }}
        >
        </Box>
      )}

      {/* Overlay backdrop for threat details */}
      {selectedThreat && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1500,
          }}
          onClick={closeThreatDetails}
        />
      )}

      {/* Offline Map Control Panel */}
      {showOfflineControl && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 200,
            width: 350,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            borderRadius: 2,
            border: "2px solid #00ff41",
            zIndex: 2000,
          }}
        >
          
        </Box>
      )}
    </Box>
  );
};

export default CesiumMap;