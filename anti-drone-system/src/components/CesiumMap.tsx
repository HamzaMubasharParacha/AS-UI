import React, { useEffect, useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import L from "leaflet";
import { TileLayer } from "react-leaflet";
import {
  MapContainer,
  Circle,
  Marker,
  Popup,
  Polyline,
  Polygon,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { command_center } from "../api/config";
import RadarComponent from "./RadarComponent";
import "leaflet-rotate";
import { MapRotateTracker } from "../utils/MapRotateTracker";
import MapInformationControls from "./MapInformationControls";
import MapLayerControls from "./MapLayerControls";
import JammerControlPanel from "./JammerControlPanel";
import Compass from "./Compass";
import MapDrawingTools from "./MapDrawingTools";

// Declare leaflet-rotate types
declare module "leaflet" {
  namespace control {
    function rotate(options?: any): Control;
  }
}

// Triangle Cone Component with Circular Edges
const TriangleCone: React.FC<{
  center: [number, number];
  direction: number;
  jammerActive?: boolean;
}> = ({ center, direction = 0, jammerActive = false }) => {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const angle = 45;
  const radius = 5000;

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
        centerLng +
          (radiusInDegrees * Math.sin(toRadians(currentAngle))) /
            Math.cos(toRadians(centerLat)),
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
    <Polygon positions={getConePoints()} pathOptions={coneColors}>
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
          <strong>STATUS:</strong>{" "}
          {jammerActive ? (
            <span style={{ color: "#FF0000", fontWeight: "bold" }}>
              JAMMING ACTIVE
            </span>
          ) : (
            <span style={{ color: "#FFD700" }}>MONITORING</span>
          )}
          <br />
          <strong>RF TRANSMISSION:</strong>{" "}
          {jammerActive ? (
            <span style={{ color: "#FF0000", fontWeight: "bold" }}>ON</span>
          ) : (
            <span style={{ color: "#00ff41" }}>OFF</span>
          )}
          {jammerActive && (
            <>
              <br />
              <strong style={{ color: "#FF0000" }}>
                WARNING: RF RADIATION ACTIVE
              </strong>
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
  jammerStatus: string;
}

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
      0% { transform: scale(1); box-shadow: 0 0 0 0 ${
        colors[threatLevel as keyof typeof colors]
      }66; }
      50% { transform: scale(1.1); box-shadow: 0 0 0 10px ${
        colors[threatLevel as keyof typeof colors]
      }00; }
      100% { transform: scale(1); box-shadow: 0 0 0 0 ${
        colors[threatLevel as keyof typeof colors]
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
          justifyContent: center;
          font-weight: bold;
          font-size: 14px;
          border: ${isDetected ? "3px solid #fff" : "2px solid #fff"};
          box-shadow: ${
            isDetected
              ? `0 0 20px ${colors[threatLevel as keyof typeof colors]}`
              : "0 4px 12px rgba(0,0,0,0.4)"
          };
          ${pulseAnimation}
        ">${droneEmojis[threatLevel as keyof typeof droneEmojis]}</div>
        ${
          isDetected
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
            justifyContent: center;
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
  coneangle,
  coneelevation,
  jammerStatus,
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [radarActive, setRadarActive] = useState(true);
  const [detectedThreats, setDetectedThreats] = useState<string[]>([]);
  const [trajectories, setTrajectories] = useState<DroneTrajectory[]>([]);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showTriangleCone, setShowTriangleCone] = useState(true);
  const [mapBearing, setMapBearing] = useState<number>(0);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Updated coordinates as requested by user (Islamabad/Rawalpindi area)
  const [latLon, setLatLon] = useState<{
    lat: number | null;
    lon: number | null;
  }>({ lat: null, lon: null });
  const centerLat = latLon.lat ?? 33.6464;
  const centerLng = latLon.lon ?? 72.999;
  const centerPosition: [number, number] = [centerLat, centerLng];
  const radius10km = 10000;
  const [activeLayer, setActiveLayer] = useState(""); // store active layer name

  // Enhanced getToken function with fallback
  const getToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setSnackbar({
        open: true,
        message: "Authentication token not found. Please login again.",
        severity: "error",
      });
      throw new Error("No authentication token");
    }
    return token;
  };

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
          throw new Error("Authentication failed for command center data");
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
      if (error instanceof Error && error.message.includes("Authentication")) {
        setSnackbar({
          open: true,
          message: error.message,
          severity: "error",
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

    setTrajectories((prevTrajectories) => {
      const updatedTrajectories = [...prevTrajectories];

      drones.forEach((drone) => {
        const existingTrajectoryIndex = updatedTrajectories.findIndex(
          (t) => t.id === drone.id
        );

        const newPoint: TrajectoryPoint = {
          position: drone.position,
          timestamp: drone.detected_at,
          speed: drone.speed,
          heading: drone.heading,
        };

        if (existingTrajectoryIndex !== -1) {
          const existingPoints =
            updatedTrajectories[existingTrajectoryIndex].points;
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

  const getTrajectoryPoints = (
    trajectory: DroneTrajectory
  ): [number, number][] => {
    return trajectory.points.map((point) => [
      point.position[1],
      point.position[0],
    ]);
  };

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
      {jammerStatus && (
        <JammerControlPanel
          coneangle={coneangle}
          coneelevation={coneelevation}
          onError={(error) => {
            setSnackbar({
              open: true,
              message: error,
              severity: "error",
            });
          }}
          onSuccess={(message) => {
            setSnackbar({
              open: true,
              message: message,
              severity: "success",
            });
          }}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: "5vh" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Compass Component */}
      <Compass bearing={mapBearing} size={100} position="bottom-left" />

      {/* Leaflet Map with Satellite Imagery */}
      <MapContainer
        center={centerPosition}
        zoomControl={false}
        zoom={12}
        rotate={true}
        rotateControl={false}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "8px",
          border: "2px solid #00ff41",
        }}
      >
        {/* Offline Tile Layer */}
        <TileLayer url={"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"} />
        <MapInformationControls activeLayer={activeLayer} />
        <MapRotateTracker onBearingChange={setMapBearing} />
        <MapLayerControls onLayerChange={setActiveLayer} />
        <MapDrawingTools></MapDrawingTools>

        {/* Triangle Cone */}
        {showTriangleCone && (
          <TriangleCone
            center={centerPosition}
            direction={coneangle}
            jammerActive={false}
          />
        )}

        {/* Drone Trajectories */}
        {showTrajectories &&
          trajectories.map((trajectory) => (
            <Polyline
              key={trajectory.id}
              positions={getTrajectoryPoints(trajectory)}
              pathOptions={{
                color: trajectory.color,
                weight: 3,
                opacity: 0.7,
                lineCap: "round",
                lineJoin: "round",
                dashArray:
                  trajectory.threat_level === "CRITICAL" ? "5, 10" : "10, 10",
                dashOffset: "0",
              }}
            />
          ))}

        {/* GEOGRAPHICALLY FIXED 10km Coverage Circle */}
        <Circle
          center={centerPosition}
          radius={radius10km}
          pathOptions={{
            color: "#00E676",
            fillColor: "#000000ff",
            fillOpacity: 0.1,
            weight: 2,
            dashArray: "5, 8",
          }}
        />

        <RadarComponent
          center={centerPosition}
          radius={radius10km}
          radarActive={radarActive}
          systemActive={systemActive}
        />

        {/* Drone Markers */}
        {drones.map((drone) => {
          const isDetected = detectedThreats.includes(drone.id);
          const actualDistance = calculateDistance(
            centerLat,
            centerLng,
            drone.position[1],
            drone.position[0]
          );
          const trajectory = trajectories.find((t) => t.id === drone.id);

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
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default CesiumMap;
