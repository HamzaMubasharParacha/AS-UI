import React, { useState, useEffect, useRef } from "react";
import { detectedDrones } from "../api/config";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  IconButton,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Modal,
  Card,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Import Leaflet CSS and components
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Define types based on your API response
interface Position {
  latitude: number;
  longitude: number;
  altitude: number;
  recordedAt: string; // Note: This is "recordedAt" not "timestamp"
}

interface Drone {
  droneId: string;
  name: string;
  image: string;
  state: string;
  whitelisted: boolean;
  attacking: boolean;
  isActive: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  positions: Position[]; // Array of positions for trajectory
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Drone[];
  timestamp: string;
}

type FilterStatus = "all" | "active" | "inactive";

// Custom drone icon for Leaflet - using isActive instead of state
const createDroneIcon = (isActive: boolean) => {
  const getColor = () => {
    if (!isActive) return "#555555"; // inactive color
    return "#00ffe0"; // active color
  };

  return L.divIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background-color: ${getColor()};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px rgba(0,0,0,0.8);
        animation: ${isActive ? "pulse 2s infinite" : "none"};
      ">
        <svg style="width: 20px; height: 20px; fill: #000000;" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 224, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(0, 255, 224, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 224, 0); }
        }
      </style>
    `,
    className: 'custom-drone-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Component to handle map view changes
const MapViewUpdater = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  
  return null;
};

// Helper function to check if coordinates are 0.0
const isZeroCoordinate = (lat: number, lng: number): boolean => {
  return Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001;
};

// Get trajectory coordinates for Polyline - show trajectory with valid coordinates
const getTrajectoryCoordinates = (drone: Drone): [number, number][] => {
  if (!drone.positions || drone.positions.length === 0) return [];
  
  // Get ALL non-zero coordinates for trajectory (don't filter too much)
  const validPositions = drone.positions.filter(pos => 
    pos && 
    !isZeroCoordinate(pos.latitude, pos.longitude)
  );
  
  if (validPositions.length === 0) return [];
  
  // Sort positions chronologically using recordedAt
  const sortedPositions = [...validPositions].sort((a, b) => 
    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  
  return sortedPositions.map(pos => [pos.latitude, pos.longitude] as [number, number]);
};

// Get the latest NON-ZERO position for display
const getLatestValidPosition = (drone: Drone): Position | null => {
  if (!drone.positions || drone.positions.length === 0) return null;
  
  // Sort positions by timestamp to get the latest (using recordedAt)
  const sortedPositions = [...drone.positions].sort((a, b) => 
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  
  // Find the latest non-zero position
  for (const pos of sortedPositions) {
    if (!isZeroCoordinate(pos.latitude, pos.longitude)) {
      return pos;
    }
  }
  
  // If all positions are 0.0, return the latest one
  return sortedPositions.length > 0 ? sortedPositions[0] : null;
};

// Get all valid positions (non-zero) for info display
const getValidPositionsCount = (drone: Drone): number => {
  if (!drone.positions) return 0;
  return drone.positions.filter(pos => !isZeroCoordinate(pos.latitude, pos.longitude)).length;
};

const DroneDetectionPanel = () => {
  // State for drones data
  const [drones, setDrones] = useState<Drone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filter
  const [filter, setFilter] = useState<FilterStatus>("all");
  
  // State for map modal
  const [openMapModal, setOpenMapModal] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const mapRef = useRef(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch drones data on component mount
  useEffect(() => {
    fetchDrones();
    
    // Set up auto-refresh
    startAutoRefresh();
    
    // Cleanup interval on component unmount
    return () => {
      stopAutoRefresh();
    };
  }, []);

  // Start auto-refresh interval
  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (autoRefresh) {
        fetchDrones();
        setLastUpdate(new Date());
      }
    }, 2000); // Every 2 seconds
  };

  // Stop auto-refresh interval
  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    if (!autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  };

  const fetchDrones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(detectedDrones);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        setDrones(data.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(data.message || "Failed to fetch drone data");
      }
    } catch (err) {
      console.error("Error fetching drones:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch drone data");
    } finally {
      setLoading(false);
    }
  };

  // Filter drones based on selected filter - using isActive
  const filteredDrones = drones.filter((drone) => {
    if (filter === "all") return true;
    if (filter === "active") return drone.isActive;
    if (filter === "inactive") return !drone.isActive;
    return true;
  });

  // Count statistics - using isActive
  const activeCount = drones.filter(d => d.isActive).length;
  const inactiveCount = drones.filter(d => !d.isActive).length;
  const totalCount = drones.length;

  const handleFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: FilterStatus | null,
  ) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  const handleOpenMap = (drone: Drone) => {
    setSelectedDrone(drone);
    setOpenMapModal(true);
  };

  const handleCloseMap = () => {
    setOpenMapModal(false);
    setSelectedDrone(null);
  };

  // Helper function to format date/time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Get status color based on isActive (replaced state)
  const getStatusColor = (drone: Drone) => {
    if (!drone.isActive) return "default"; // gray for inactive
    return "success"; // green for active
  };

  // Get status text based on isActive (replaced state)
  const getStatusText = (drone: Drone) => {
    if (!drone.isActive) return "Inactive";
    return "Active";
  };

  // Format last update time
  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (loading && drones.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading drone data...</Typography>
      </Paper>
    );
  }

  if (error && drones.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error: {error}</Typography>
        <button onClick={fetchDrones}>Retry</button>
      </Paper>
    );
  }

  return (
    <>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header with filter buttons and refresh controls */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          mb: 2 
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Detected Drones ({totalCount})
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={handleFilterChange}
              aria-label="drone status filter"
              size="small"
            >
              <ToggleButton value="all" aria-label="all drones">
                All ({totalCount})
              </ToggleButton>
              <ToggleButton value="active" aria-label="active drones" sx={{ 
                color: filter === 'active' ? 'var(--active-color)' : 'inherit',
                '&.Mui-selected': { 
                  backgroundColor: '#5a5a5a',
                  color: 'white',
                  '&:hover': { backgroundColor: '#5a5a5a' }
                }
              }}>
                Active ({activeCount})
              </ToggleButton>
              <ToggleButton value="inactive" aria-label="inactive drones" sx={{ 
                color: filter === 'inactive' ? 'var(--inactive-color)' : 'inherit',
                '&.Mui-selected': { 
                  backgroundColor: '#5a5a5a',
                  color: 'white',
                  '&:hover': { backgroundColor: '#5a5a5a' }
                }
              }}>
                Inactive ({inactiveCount})
              </ToggleButton>
            </ToggleButtonGroup>
            
           
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--header-color)', borderRadius: '10px 0px 0px 10px', color: 'white' }}>
                  Image
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--header-color)', color: 'white' }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--header-color)', color: 'white' }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--header-color)', color: 'white' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--header-color)', color: 'white' }}>
                  Last Seen
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--header-color)', color: 'white' }}>
                  Last Position
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--header-color)', borderRadius: '0px 10px 10px 0px', color: 'white' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrones.map((drone) => {
                const latestPosition = getLatestValidPosition(drone);
                const validPositionsCount = getValidPositionsCount(drone);
                const totalPositionsCount = drone.positions?.length || 0;
                
                return (
                  <TableRow
                    key={drone.droneId}
                    hover
                    sx={{
                      "&:hover": { backgroundColor: "#f9f9f9" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell>
                      <Avatar
                        src={drone.image}
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: "transparent",
                          color: "#000",
                          boxShadow: 1,
                          borderRadius: "0px",
                        }}
                      >
                        {!drone.image && <SettingsRemoteIcon />}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {drone.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Positions: {validPositionsCount}/{totalPositionsCount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {drone.droneId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(drone)}
                        color={getStatusColor(drone)}
                        size="small"
                        sx={{ 
                          fontWeight: 500, 
                          minWidth: 80,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTime(drone.lastSeenAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {latestPosition ? (
                        isZeroCoordinate(latestPosition.latitude, latestPosition.longitude) ? (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No coordinates
                          </Typography>
                        ) : (
                          <Typography variant="body2">
                            {latestPosition.latitude.toFixed(4)}, {latestPosition.longitude.toFixed(4)}
                          </Typography>
                        )
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          No position data
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenMap(drone)}
                        sx={{
                          bgcolor: "var(--primary-color, #7bff00)",
                          color: "#000",
                          "&:hover": { bgcolor: "var(--primary-color, #6ae600)" },
                          borderRadius: 1,
                        }}
                        size="small"
                        title="View on Map"
                      >
                        <MapIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Stats */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing: <strong>{filteredDrones.length}</strong> of <strong>{totalCount}</strong> drones
          </Typography>
        </Box>
      </Paper>

      {/* Map Modal with Leaflet */}
      <Modal
        open={openMapModal}
        onClose={handleCloseMap}
        aria-labelledby="drone-map-modal"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <Card
          sx={{
            width: 600,
            height: 600,
            position: "relative",
            overflow: "hidden",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            border: "2px solid var(--primary-color, #7bff00)",
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={handleCloseMap}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1000,
              backgroundColor: "var(--primary-color, #7bff00)",
              color: "#000",
              "&:hover": {
                backgroundColor: "var(--primary-color, #6ae600)",
              },
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Map header */}
          {selectedDrone && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: "rgba(0,0,0,0.9)",
                color: "white",
                p: 2,
                zIndex: 1000,
                borderBottom: "2px solid var(--primary-color, #7bff00)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={selectedDrone.image}
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: "transparent",
                      borderRadius: "0px",
                      color: "#000",
                    }}
                  >
                    {!selectedDrone.image && <SettingsRemoteIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedDrone.name}
                    </Typography>
                    <Typography variant="body2">
                      ID: {selectedDrone.droneId} • Last seen: {formatTime(selectedDrone.lastSeenAt)}
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", color: "#aaa" }}>
                      Valid positions: {getValidPositionsCount(selectedDrone)} of {selectedDrone.positions?.length || 0}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={getStatusText(selectedDrone)}
                  color={getStatusColor(selectedDrone)}
                  sx={{ fontWeight: 600 }}
                  size="small"
                />
              </Box>
            </Box>
          )}

          {/* Leaflet Map */}
          {selectedDrone && (
            <Box sx={{ width: "100%", height: "100%" }}>
              <MapContainer
                center={[33.6464, 72.999]} // Default center
                zoom={14}
                style={{ width: "100%", height: "100%", borderRadius: "10px" }}
                scrollWheelZoom={true}
                zoomControl={true}
                ref={mapRef}
              >
                {/* OpenStreetMap Tile Layer */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Drone Trajectory - show only valid coordinates */}
                {(() => {
                  const trajectory = getTrajectoryCoordinates(selectedDrone);
                  if (trajectory.length > 1) {
                    return (
                      <Polyline
                        positions={trajectory}
                        pathOptions={{
                          color: selectedDrone.isActive ? "#00ffe0" : "#555555",
                          weight: 3,
                          opacity: 0.7,
                          lineCap: "round",
                          lineJoin: "round",
                          dashArray: selectedDrone.state === "danger" ? "5, 10" : "10, 10",
                        }}
                      />
                    );
                  }
                  return null;
                })()}
                
                {/* Drone Marker - show at latest valid position */}
                {(() => {
                  const latestPosition = getLatestValidPosition(selectedDrone);
                  if (latestPosition) {
                    const isZeroPos = isZeroCoordinate(latestPosition.latitude, latestPosition.longitude);
                    
                    return (
                      <>
                        <Marker 
                          position={[
                            isZeroPos ? 33.6464 : latestPosition.latitude, 
                            isZeroPos ? 72.999 : latestPosition.longitude
                          ]}
                          icon={createDroneIcon(selectedDrone.isActive)}
                        >
                          <Popup>
                            <Box sx={{ p: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {selectedDrone.name}
                              </Typography>
                              <Typography variant="body2">
                                ID: {selectedDrone.droneId}
                              </Typography>
                              <Typography variant="body2">
                                Status: {getStatusText(selectedDrone)}
                              </Typography>
                              <Typography variant="body2">
                                State: {selectedDrone.state}
                              </Typography>
                              <Typography variant="body2">
                                Valid positions: {getValidPositionsCount(selectedDrone)} of {selectedDrone.positions?.length || 0}
                              </Typography>
                              <Typography variant="body2">
                                First seen: {formatTime(selectedDrone.firstSeenAt)}
                              </Typography>
                              <Typography variant="body2">
                                Last seen: {formatTime(selectedDrone.lastSeenAt)}
                              </Typography>
                              {isZeroPos ? (
                                <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#ff4444", fontFamily: "monospace" }}>
                                  ⚠️ Last position: No valid coordinates (0.0, 0.0)
                                </Typography>
                              ) : (
                                <>
                                  <Typography variant="caption" sx={{ display: "block", mt: 1, fontFamily: "monospace" }}>
                                    Latest valid position: {latestPosition.latitude.toFixed(6)}, {latestPosition.longitude.toFixed(6)}
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, fontFamily: "monospace" }}>
                                    Recorded at: {formatTime(latestPosition.recordedAt)}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </Popup>
                        </Marker>
                        
                        {/* Update map view to the latest valid position */}
                        {!isZeroPos && (
                          <MapViewUpdater 
                            lat={latestPosition.latitude} 
                            lng={latestPosition.longitude} 
                          />
                        )}
                      </>
                    );
                  }
                  return null;
                })()}
              </MapContainer>
            </Box>
          )}

          {/* Map controls info */}
          <Box
            sx={{
              position: "absolute",
              bottom: 10,
              left: 10,
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "white",
              p: 1.5,
              borderRadius: "8px",
              zIndex: 1000,
              fontSize: "12px",
            }}
          >
            <Typography variant="caption" sx={{ display: "block" }}>
              🖱️ Scroll to zoom • Click and drag to pan
            </Typography>
            {selectedDrone && (() => {
              const latestPosition = getLatestValidPosition(selectedDrone);
              if (latestPosition) {
                const isZeroPos = isZeroCoordinate(latestPosition.latitude, latestPosition.longitude);
                if (isZeroPos) {
                  return (
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#ff4444" }}>
                      ⚠️ Showing default location (no valid coordinates)
                    </Typography>
                  );
                }
                return (
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, fontFamily: "monospace" }}>
                    📍 {latestPosition.latitude.toFixed(4)}, {latestPosition.longitude.toFixed(4)}
                  </Typography>
                );
              }
              return null;
            })()}
          </Box>
        </Card>
      </Modal>
    </>
  );
};

export default DroneDetectionPanel;