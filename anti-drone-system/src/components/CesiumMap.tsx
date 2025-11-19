import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { MapContainer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapDrawingTools from './MapDrawingTools';
import { createESRISatelliteOfflineLayer } from '../utils/OfflineTileLayer';
import OfflineMapControl from './OfflineMapControl';

// Custom Radar Component for animated scanning
const RadarSweep: React.FC<{ center: [number, number] }> = ({ center }) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, []);

  // Create radar sweep using SVG
  const radarSweepIcon = new L.DivIcon({
    html: `
      <div style="
        position: relative;
        width: 300px;
        height: 300px;
        pointer-events: none;
        transform: rotate(${rotation}deg);
        transition: none;
      ">
        <svg width="300" height="300" style="position: absolute; top: 0; left: 0;">
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#00ff41;stop-opacity:0.8" />
              <stop offset="30%" style="stop-color:#00ff41;stop-opacity:0.4" />
              <stop offset="70%" style="stop-color:#00ff41;stop-opacity:0.1" />
              <stop offset="100%" style="stop-color:#00ff41;stop-opacity:0" />
            </radialGradient>
          </defs>
          <path d="M 150 150 L 150 0 A 150 150 0 0 1 255.9 75 Z"
                fill="url(#radarGradient)"
                opacity="0.7"/>
        </svg>
      </div>
    `,
    className: 'radar-sweep',
    iconSize: [300, 300],
    iconAnchor: [150, 150],
  });

  return <Marker position={center} icon={radarSweepIcon} />;
};

interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}

interface CesiumMapProps {
  drones: DroneData[];
  systemActive: boolean;
  drawingToolsEnabled?: boolean;
}

// Custom component to add offline tile layer
const OfflineTileLayerComponent: React.FC<{ offlineFirst: boolean }> = ({ offlineFirst }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add offline tile layer
    const offlineLayer = createESRISatelliteOfflineLayer({
      offlineFirst: offlineFirst
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
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
  className: 'command-center-icon',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Create drone icons based on threat level with enhanced detection highlighting
const createDroneIcon = (threatLevel: string, isDetected: boolean, distance: number) => {
  const colors = {
    LOW: '#4CAF50',
    MEDIUM: '#FF9800',
    HIGH: '#F44336',
    CRITICAL: '#D32F2F'
  };

  const droneEmojis = {
    LOW: '🛩️',
    MEDIUM: '🚁',
    HIGH: '✈️',
    CRITICAL: '🚀'
  };

  const pulseAnimation = isDetected ? `
    animation: pulse 1.5s infinite;
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 ${colors[threatLevel as keyof typeof colors]}66; }
      50% { transform: scale(1.1); box-shadow: 0 0 0 10px ${colors[threatLevel as keyof typeof colors]}00; }
      100% { transform: scale(1); box-shadow: 0 0 0 0 ${colors[threatLevel as keyof typeof colors]}00; }
    }
  ` : '';

  const detectionRing = isDetected ? `
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
  ` : '';
  
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
          border: ${isDetected ? '3px solid #fff' : '2px solid #fff'};
          box-shadow: ${isDetected ? `0 0 20px ${colors[threatLevel as keyof typeof colors]}` : '0 4px 12px rgba(0,0,0,0.4)'};
          ${pulseAnimation}
        ">${droneEmojis[threatLevel as keyof typeof droneEmojis]}</div>
        ${isDetected ? `
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
        ` : ''}
      </div>
    `,
    className: `drone-icon ${isDetected ? 'detected' : ''}`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const CesiumMap: React.FC<CesiumMapProps> = ({ drones, systemActive, drawingToolsEnabled = false }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [radarActive, setRadarActive] = useState(true);
  const [detectedThreats, setDetectedThreats] = useState<string[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<DroneData | null>(null);
  const [offlineMode, setOfflineMode] = useState(true);
  const [showOfflineControl, setShowOfflineControl] = useState(false);
  const mapRef = useRef<L.Map>(null);

  // Updated coordinates as requested by user (Islamabad/Rawalpindi area)
  const centerLat = 33.6375773;
  const centerLng = 72.9877674;
  const centerPosition: [number, number] = [centerLat, centerLng];

  // Calculate 10km and 3KM radius in meters
  const radius10km = 5000; // 5 kilometers in meters
  const radius3km = 3000; // 3 kilometers in meters

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  // Threat detection logic - check which drones are within radar range
  useEffect(() => {
    if (radarActive && systemActive) {
      const detected: string[] = [];
      drones.forEach(drone => {
        const distance = calculateDistance(
          centerLat, centerLng,
          drone.position[1], drone.position[0]
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

  // Toggle radar scanning
  const toggleRadar = () => {
    setRadarActive(!radarActive);
  };

  // Handle threat selection
  const handleThreatClick = (drone: DroneData) => {
    setSelectedThreat(drone);
  };

  // Close threat details
  const closeThreatDetails = () => {
    setSelectedThreat(null);
  };

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: {
        xs: 'calc(100vh - 45px)', // Small mobile
        sm: 'calc(100vh - 50px)', // Mobile
        md: 'calc(100vh - 60px)', // Desktop
      },
      overflow: 'hidden'
    }}>
      {/* Leaflet Map with Satellite Imagery */}
      <MapContainer
        center={centerPosition}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '8px', border: '2px solid #00ff41' }}
        ref={mapRef}
      >
        {/* Offline Tile Layer */}
        <OfflineTileLayerComponent offlineFirst={offlineMode} />
        
        {/* Animated Radar Sweep - GEOGRAPHICALLY FIXED */}
        {radarActive && systemActive && (
          <RadarSweep center={centerPosition} />
        )}

        {/* GEOGRAPHICALLY FIXED 10km Coverage Circle */}
        <Circle
          center={centerPosition}
          radius={radius10km}
          pathOptions={{
            color: '#00E676',
            fillColor: '#00E676',
            fillOpacity: 0.1,
            weight: 3,
            dashArray: '10, 10'
          }}
        />

        {/* GEOGRAPHICALLY FIXED 3KM Coverage Circle */}
        <Circle
          center={centerPosition}
          radius={radius3km}
          pathOptions={{
            color: '#00E676',
            fillColor: '#00E676',
            fillOpacity: 0.05,
            weight: 2,
            dashArray: '5, 5'
          }}
        />

        {/* GEOGRAPHICALLY FIXED Command Center Marker */}
        <Marker position={centerPosition} icon={commandCenterIcon}>
          <Popup>
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <strong>🏢 COMMAND CENTER</strong><br/>
              <strong>LAT:</strong> {centerLat}<br/>
              <strong>LNG:</strong> {centerLng}<br/>
              <strong>STATUS:</strong> {systemActive ? 'ONLINE' : 'OFFLINE'}<br/>
              <strong>RADAR:</strong> {radarActive ? 'SCANNING' : 'OFFLINE'}<br/>
              <strong>COVERAGE:</strong> 10km RADIUS
            </div>
          </Popup>
        </Marker>

        {/* Drone Markers - Each positioned at their geographic coordinates with detection highlighting */}
        {drones.map((drone) => {
          const isDetected = detectedThreats.includes(drone.id);
          const actualDistance = calculateDistance(
            centerLat, centerLng,
            drone.position[1], drone.position[0]
          );
          
          return (
            <Marker
              key={drone.id}
              position={[drone.position[1], drone.position[0]]} // [lat, lng]
              icon={createDroneIcon(drone.threat_level, isDetected, actualDistance)}
              eventHandlers={{
                click: () => handleThreatClick(drone)
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                  <strong style={{ color: isDetected ? '#ff0000' : '#333' }}>
                    {isDetected ? '🚨 DETECTED THREAT' : '🎯 DRONE'}
                  </strong><br/>
                  <strong>ID:</strong> {drone.id}<br/>
                  <strong>THREAT LEVEL:</strong> <span style={{ color:
                    drone.threat_level === 'LOW' ? '#4CAF50' :
                    drone.threat_level === 'MEDIUM' ? '#FF9800' :
                    drone.threat_level === 'HIGH' ? '#F44336' : '#D32F2F'
                  }}>{drone.threat_level}</span><br/>
                  <strong>DISTANCE:</strong> {actualDistance.toFixed(0)}m<br/>
                  <strong>SPEED:</strong> {drone.speed.toFixed(1)}km/h<br/>
                  <strong>HEADING:</strong> {drone.heading}°<br/>
                  <strong>LAT:</strong> {drone.position[1].toFixed(4)}<br/>
                  <strong>LNG:</strong> {drone.position[0].toFixed(4)}<br/>
                  <strong>DETECTED:</strong> {drone.detected_at}<br/>
                  {isDetected && (
                    <>
                      <strong style={{ color: '#ff0000' }}>STATUS:</strong> <span style={{ color: '#ff0000' }}>IN RADAR RANGE</span><br/>
                      <strong style={{ color: '#ff0000' }}>ALERT:</strong> <span style={{ color: '#ff0000' }}>ACTIVE TRACKING</span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Map Drawing Tools */}
        {drawingToolsEnabled && <MapDrawingTools />}
      </MapContainer>
      
      {/* Overlay information */}
      {/* <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#00ff41',
          padding: 1.5,
          borderRadius: 2,
          fontFamily: 'monospace',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 1000,
        }}
      >
        <Typography variant="caption" display="block">
          🛰️ SATELLITE VIEW (ESRI)
        </Typography>
        <Typography variant="caption" display="block">
          ACTIVE TARGETS: {drones.length}
        </Typography>
        <Typography variant="caption" display="block">
          SYSTEM: {systemActive ? 'ONLINE' : 'OFFLINE'}
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: radarActive && systemActive ? '#00ff41' : '#ff9800' }}>
          RADAR: {radarActive && systemActive ? 'SCANNING' : 'OFFLINE'}
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: detectedThreats.length > 0 ? '#ff0000' : '#00ff41' }}>
          DETECTED: {detectedThreats.length} THREATS
        </Typography>
        <Typography variant="caption" display="block">
          LOCATION: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
        </Typography>
        <Typography variant="caption" display="block">
          SOURCE: GEOGRAPHIC POSITIONING
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: offlineMode ? '#00ff41' : '#ff9800' }}>
          MODE: {offlineMode ? 'OFFLINE FIRST' : 'ONLINE ONLY'}
        </Typography>
      </Box> */}

      {/* Radar Control Panel */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 200,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#00ff41',
          padding: 1.5,
          borderRadius: 2,
          fontFamily: 'monospace',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 1000,
          cursor: 'pointer',
          border: '1px solid #00ff41',
        }}
        onClick={toggleRadar}
      >
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
          📡 RADAR CONTROL
        </Typography>
        <Typography variant="caption" display="block">
          STATUS: {radarActive ? 'ACTIVE' : 'INACTIVE'}
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontSize: '10px', opacity: 0.8 }}>
          CLICK TO TOGGLE
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: '#00ff41' }}>
          📱 CLICK MAP CONTROLS FOR OFFLINE OPTIONS
        </Typography>
      </Box>

      {/* Map legend */}
      {/* <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          color: '#333',
          padding: 1.5,
          borderRadius: 2,
          fontFamily: 'Arial',
          fontSize: '11px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid #ddd',
          zIndex: 1000,
        }}
      >
        <Typography variant="caption" display="block" sx={{ color: '#4CAF50', fontWeight: 'bold', mb: 0.5 }}>
          ● LOW THREAT
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#FF9800', fontWeight: 'bold', mb: 0.5 }}>
          ● MEDIUM THREAT
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#F44336', fontWeight: 'bold', mb: 0.5 }}>
          ● HIGH THREAT
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#D32F2F', fontWeight: 'bold', mb: 0.5 }}>
          ● CRITICAL THREAT
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#00E676', fontWeight: 'bold' }}>
          🏢 COMMAND CENTER
        </Typography>
      </Box> */}

      {/* Status indicator */}
      {/* <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: 1.5,
          borderRadius: 2,
          fontFamily: 'Arial',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid #ddd',
          zIndex: 1000,
        }}
      >
        <Typography variant="caption" display="block" sx={{ color: mapLoaded ? '#00E676' : '#ff9800', fontWeight: 'bold' }}>
          MAP STATUS: {mapLoaded ? 'LOADED' : 'LOADING...'}
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#333' }}>
          MODE: SATELLITE VIEW
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#333' }}>
          COVERAGE: 10km RADIUS
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#00E676', fontWeight: 'bold' }}>
          GEOGRAPHIC POSITIONING: ACTIVE
        </Typography>
      </Box> */}

      {/* Navigation Instructions */}
      {/* <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          color: '#333',
          padding: 1.5,
          borderRadius: 2,
          fontFamily: 'Arial',
          fontSize: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid #ddd',
          zIndex: 1000,
        }}
      >
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
          🛰️ ESRI SATELLITE IMAGERY
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
          📍 COORDINATES: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
          🎯 GEOGRAPHIC 10km COVERAGE
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: '#00E676' }}>
          🏢 COMMAND CENTER: GEOGRAPHICALLY FIXED
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: radarActive && systemActive ? '#00ff41' : '#ff9800' }}>
          📡 RADAR: {radarActive && systemActive ? 'ACTIVE SCANNING' : 'STANDBY'}
        </Typography>
      </Box> */}

      {/* Coordinates Display */}
      {/* <Box
        sx={{
          position: 'absolute',
          top: 150,
          left: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#00ff41',
          padding: 1,
          borderRadius: 2,
          fontFamily: 'monospace',
          fontSize: '11px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          border: '1px solid #00ff41',
          zIndex: 1000,
        }}
      >
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
          📍 COMMAND CENTER
        </Typography>
        <Typography variant="caption" display="block">
          LAT: {centerLat}
        </Typography>
        <Typography variant="caption" display="block">
          LNG: {centerLng}
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: '#00E676' }}>
          GEOGRAPHIC FIXED
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: radarActive && systemActive ? '#00ff41' : '#ff9800' }}>
          RADAR: {radarActive && systemActive ? 'SCANNING' : 'STANDBY'}
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontSize: '10px', cursor: 'pointer', color: '#00ff41' }}
          onClick={() => setShowOfflineControl(!showOfflineControl)}
        >
          {showOfflineControl ? '🔽 HIDE OFFLINE CONTROLS' : '🔼 SHOW OFFLINE CONTROLS'}
        </Typography>
      </Box> */}

      {/* Detailed Threat Information Panel */}
      {selectedThreat && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: '#00ff41',
            padding: 3,
            borderRadius: 3,
            fontFamily: 'monospace',
            fontSize: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            border: '2px solid #ff0000',
            zIndex: 2000,
            minWidth: '400px',
            maxWidth: '500px',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#ff0000', fontWeight: 'bold', fontFamily: 'monospace' }}>
              🚨 THREAT ANALYSIS
            </Typography>
            <Box
              sx={{
                cursor: 'pointer',
                color: '#ff0000',
                fontSize: '20px',
                fontWeight: 'bold',
                '&:hover': { color: '#fff' }
              }}
              onClick={closeThreatDetails}
            >
              ✕
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Left Column - Basic Info */}
            <Box>
              <Typography variant="caption" display="block" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                BASIC INFORMATION
              </Typography>
              <Typography variant="caption" display="block">
                <strong>DRONE ID:</strong> {selectedThreat.id}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                <strong>THREAT LEVEL:</strong> <span style={{
                  color: selectedThreat.threat_level === 'LOW' ? '#4CAF50' :
                        selectedThreat.threat_level === 'MEDIUM' ? '#FF9800' :
                        selectedThreat.threat_level === 'HIGH' ? '#F44336' : '#D32F2F',
                  fontWeight: 'bold'
                }}>{selectedThreat.threat_level}</span>
              </Typography>

              <Typography variant="caption" display="block" sx={{ color: '#fff', fontWeight: 'bold', mb: 1, mt: 2 }}>
                POSITION DATA
              </Typography>
              <Typography variant="caption" display="block">
                <strong>LATITUDE:</strong> {selectedThreat.position[1].toFixed(6)}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>LONGITUDE:</strong> {selectedThreat.position[0].toFixed(6)}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>ALTITUDE:</strong> {selectedThreat.position[2]}m
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                <strong>DISTANCE:</strong> {calculateDistance(
                  centerLat, centerLng,
                  selectedThreat.position[1], selectedThreat.position[0]
                ).toFixed(0)}m from Command Center
              </Typography>
            </Box>

            {/* Right Column - Movement & Status */}
            <Box>
              <Typography variant="caption" display="block" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                MOVEMENT DATA
              </Typography>
              <Typography variant="caption" display="block">
                <strong>SPEED:</strong> {selectedThreat.speed.toFixed(1)} km/h
              </Typography>
              <Typography variant="caption" display="block">
                <strong>HEADING:</strong> {selectedThreat.heading}°
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                <strong>FIRST DETECTED:</strong> {selectedThreat.detected_at}
              </Typography>

              <Typography variant="caption" display="block" sx={{ color: '#fff', fontWeight: 'bold', mb: 1, mt: 2 }}>
                DETECTION STATUS
              </Typography>
              <Typography variant="caption" display="block" sx={{
                color: detectedThreats.includes(selectedThreat.id) ? '#ff0000' : '#00ff41'
              }}>
                <strong>RADAR STATUS:</strong> {detectedThreats.includes(selectedThreat.id) ? 'IN RANGE' : 'OUT OF RANGE'}
              </Typography>
              <Typography variant="caption" display="block" sx={{
                color: detectedThreats.includes(selectedThreat.id) ? '#ff0000' : '#00ff41'
              }}>
                <strong>TRACKING:</strong> {detectedThreats.includes(selectedThreat.id) ? 'ACTIVE' : 'PASSIVE'}
              </Typography>
              <Typography variant="caption" display="block" sx={{
                color: selectedThreat.threat_level === 'CRITICAL' || selectedThreat.threat_level === 'HIGH' ? '#ff0000' : '#ff9800'
              }}>
                <strong>PRIORITY:</strong> {
                  selectedThreat.threat_level === 'CRITICAL' ? 'IMMEDIATE ACTION' :
                  selectedThreat.threat_level === 'HIGH' ? 'HIGH PRIORITY' :
                  selectedThreat.threat_level === 'MEDIUM' ? 'MONITOR CLOSELY' : 'ROUTINE SURVEILLANCE'
                }
              </Typography>
            </Box>
          </Box>

          {/* Threat Assessment */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: 2, border: '1px solid #ff0000' }}>
            <Typography variant="caption" display="block" sx={{ color: '#ff0000', fontWeight: 'bold', mb: 1 }}>
              🎯 THREAT ASSESSMENT
            </Typography>
            <Typography variant="caption" display="block" sx={{ fontSize: '12px' }}>
              {selectedThreat.threat_level === 'CRITICAL' &&
                "⚠️ CRITICAL THREAT: Immediate countermeasures required. High-speed approach detected. Potential hostile intent."
              }
              {selectedThreat.threat_level === 'HIGH' &&
                "⚠️ HIGH THREAT: Close monitoring required. Unusual flight pattern detected. Prepare countermeasures."
              }
              {selectedThreat.threat_level === 'MEDIUM' &&
                "⚠️ MEDIUM THREAT: Standard monitoring protocol. Maintain surveillance. Ready defensive systems."
              }
              {selectedThreat.threat_level === 'LOW' &&
                "ℹ️ LOW THREAT: Routine surveillance. Standard civilian or commercial drone. Continue monitoring."
              }
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
            <Box
              sx={{
                backgroundColor: '#ff9800',
                color: '#000',
                padding: '8px 16px',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                '&:hover': { backgroundColor: '#ffb74d' }
              }}
              onClick={() => console.log('Track drone:', selectedThreat.id)}
            >
              📡 TRACK DRONE
            </Box>
            <Box
              sx={{
                backgroundColor: '#f44336',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                '&:hover': { backgroundColor: '#ef5350' }
              }}
              onClick={() => console.log('Deploy countermeasures:', selectedThreat.id)}
            >
              🚀 COUNTERMEASURES
            </Box>
            <Box
              sx={{
                backgroundColor: '#4caf50',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                '&:hover': { backgroundColor: '#66bb6a' }
              }}
              onClick={closeThreatDetails}
            >
              ✓ CLOSE
            </Box>
          </Box>
        </Box>
      )}

      {/* Overlay backdrop for threat details */}
      {selectedThreat && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1500,
          }}
          onClick={closeThreatDetails}
        />
      )}

      {/* Offline Map Control Panel */}
      {showOfflineControl && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 200,
            width: 350,
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            borderRadius: 2,
            border: '2px solid #00ff41',
            zIndex: 2000,
          }}
        >
          <OfflineMapControl
            onOfflineModeChange={setOfflineMode}
            currentBounds={mapRef.current ? {
              north: mapRef.current.getBounds().getNorth(),
              south: mapRef.current.getBounds().getSouth(),
              east: mapRef.current.getBounds().getEast(),
              west: mapRef.current.getBounds().getWest()
            } : undefined}
            currentZoom={mapRef.current?.getZoom()}
          />
        </Box>
      )}
    </Box>
  );
};

export default CesiumMap;