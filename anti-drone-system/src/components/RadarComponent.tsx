import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  Circle,
  Polyline,
  useMap,
  CircleMarker,
  Tooltip,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "./RadarComponent.css";

// ==========================
// Radar Sweep Line Component
// ==========================
const RadarSweepLine: React.FC<{
  center: [number, number];
  radius: number;
  radarActive?: boolean;
  systemActive?: boolean;
}> = ({ center, radius, radarActive = true, systemActive = true }) => {
  const map = useMap();
  const [angle, setAngle] = useState(0);
 
  const lineRef = useRef<L.Polyline | null>(null);
  const glowRef = useRef<L.Polygon | null>(null);
  const intervalRef = useRef<any>(null);
 
  // Completely remove sweep from map
  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }
    if (glowRef.current) {
      map.removeLayer(glowRef.current);
      glowRef.current = null;
    }
  };
 
  // Start/Stop sweep based on active states
  useEffect(() => {
    if (!radarActive || !systemActive) {
      cleanup();
      return;
    }
 
    cleanup(); // reset before creating new layers
 
    // // Create main sweep line with glow effect
    // lineRef.current = L.polyline([], {
    //   color: "#00ff41",
    //   weight: 4,
    //   opacity: 1,
    //   className: "radar-sweep-line",
    // }).addTo(map);
 
    // Create glow cone polygon
    // glowRef.current = L.polygon([], {
    //   color: "none",
    //   fillColor: "rgba(0,255,65,0.15)",
    //   fillOpacity: 0.3,
    //   className: "radar-sweep-glow",
    // }).addTo(map);
 
    // Rotation interval
    intervalRef.current = setInterval(() => {
      setAngle((prev) => (prev - 2 + 360) % 360);
    }, 50);
 
    return () => cleanup();
  }, [radarActive, systemActive]);
 
  // Update sweep geometry when angle changes
  useEffect(() => {
    if (!lineRef.current || !glowRef.current) return;
    if (!radarActive || !systemActive) return;
 
    const [lat, lng] = center;
    const rad = (angle * Math.PI) / 180;
 
    // Convert radius meters → degrees
    const degLat = radius / 111320;
    const degLng = radius / (111320 * Math.cos((lat * Math.PI) / 180));
 
    // Sweep endpoint
    const endLat = lat + Math.sin(rad) * degLat;
    const endLng = lng + Math.cos(rad) * degLng;
 
    lineRef.current.setLatLngs([
      [lat, lng],
      [endLat, endLng],
    ]);
 
    // ±3° glow for better visual effect
    const g1 = (angle - 3) * (Math.PI / 180);
    const g2 = (angle + 3) * (Math.PI / 180);
 
    glowRef.current.setLatLngs([
      [lat, lng],
      [lat + Math.sin(g1) * degLat, lng + Math.cos(g1) * degLng],
      [lat + Math.sin(g2) * degLat, lng + Math.cos(g2) * degLng],
    ]);
  }, [angle, center, radius, radarActive, systemActive]);
 
  return null;
};
 
// ==========================
// Helper: Destination Point
// ==========================
const destinationPoint = (
  lat: number,
  lng: number,
  distanceKm: number,
  bearing: number
): [number, number] => {
  const R = 6371;
  const δ = distanceKm / R;
  const θ = (bearing * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
 
  const sinφ2 =
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);
 
  return [(φ2 * 180) / Math.PI, (((λ2 * 180) / Math.PI + 540) % 360) - 180];
};
 
// ==========================
// Cardinal Direction Markers
// ==========================
const CardinalDirections: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  // hide at low zoom
  if (zoom < 10) return null;
 
  const [centerLat, centerLng] = center;
 
  const cardinalPoints = [
    { degree: 0, label: "N" },
    { degree: 90, label: "E" },
    { degree: 180, label: "S" },
    { degree: 270, label: "W" },
  ];
 
  return (
    <>
      {cardinalPoints.map(({ degree, label }) => {
        const position = destinationPoint(centerLat, centerLng, 10.5, degree);
 
        return (
          <Marker
            key={label}
            position={position}
            interactive={false}
            icon={L.divIcon({
              className: "cardinal-direction",
              html: `
                <div style="
                  color: black;
                  font-weight: 800;
                  font-size: 14px;
                  font-family: 'Arial Black', sans-serif;
                ">${label}</div>
              `,
              iconSize: [40, 40],
            })}
          />
        );
      })}
    </>
  );
};
 
const DistanceMarkings: React.FC<{
  center: [number, number];
  radiusKm: number;
  zoom: number;
}> = ({ center, radiusKm, zoom }) => {
  if (zoom < 12) return null; // hide when zoomed out
 
  const [centerLat, centerLng] = center;
 
  // show markers less frequently depending on zoom
  // const spacing =
  //   zoom < 13 ? 180 : zoom < 14 ? 90 : zoom < 16 ? 45 : zoom < 18 ? 30 : 20;
 
  let spacing;
 
  if (radiusKm > 9) {
    spacing =
      zoom < 13 ? 30 : zoom < 14 ? 20 : zoom < 16 ? 5 : zoom < 18 ? 1 : 0.5;
  } else if (radiusKm > 7) {
    spacing =
      zoom < 13 ? 45 : zoom < 14 ? 20 : zoom < 16 ? 10 : zoom < 18 ? 2 : 1;
  } else if (radiusKm > 4) {
    spacing =
      zoom < 13 ? 90 : zoom < 14 ? 30 : zoom < 16 ? 20 : zoom < 18 ? 10 : 2;
  } else {
    spacing =
      zoom < 13 ? 90 : zoom < 14 ? 45 : zoom < 16 ? 30 : zoom < 18 ? 20 : 10;
  }
  const markers = [];
 
  for (let deg = 0; deg < 360; deg += spacing) {
    const pos = destinationPoint(centerLat, centerLng, radiusKm, deg);
 
    markers.push(
      <Marker
        key={`${radiusKm}-${deg}`}
        position={pos}
        interactive={false}
        icon={L.divIcon({
          className: "distance-marking",
          html: `
      <div style="
        background: transparent;
        color: black;
        font-weight: 700;
        font-size: 14px;
        font-family: 'Courier New', monospace;
        white-space: nowrap;
      ">${radiusKm}km</div>
    `,
          iconSize: [50, 24],
          iconAnchor: [25, 12],
        })}
      />
    );
  }
 
  return <>{markers}</>;
};
 
// ==========================
// Main Radar Component
// ==========================
interface RadarComponentProps {
  center: [number, number];
  radius: number;
  radarActive: boolean;
  systemActive: boolean;
}
 
const RadarComponent: React.FC<RadarComponentProps> = ({
  center,
  radius,
  radarActive,
  systemActive,
}) => {
  const [centerLat, centerLng] = center;
  const map = useMap();
 
  // State to track zoom and update label font size
  const [zoom, setZoom] = useState(map.getZoom());
 
  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on("zoom", handleZoom);
    return () => {
      map.off("zoom", handleZoom);
    };
  }, [map]);
 
  // North/East/South/West lines
  const radarLines = useMemo(() => {
    return [0, 90, 180, 270].map((bearing) => [
      center,
      destinationPoint(centerLat, centerLng, 10, bearing),
    ]);
  }, [center, centerLat, centerLng]);
 
  return (
    <>
      {/* Radar Sweep */}
      {zoom >= 12 && (
        <RadarSweepLine
          center={center}
          radius={radius}
          radarActive={radarActive}
          systemActive={systemActive}
        />
      )}
 
      {/* Radar Range Circles with labels and degree markings */}
      {Array.from({ length: 10 }).map((_, i) => {
        const radiusKm = i + 1;
        const radiusMeters = radiusKm * 1000;
 
        return (
          <React.Fragment key={i}>
            {/* Circle in meters */}
            {zoom >= 12 && (
              <Circle
                center={center}
                radius={radiusMeters}
                pathOptions={{
                  color: "#00ff41ff",
                  fillColor: "transparent",
                  fillOpacity: 0,
                  weight: 2,
                  opacity: 0.8,
                  className: `radar-circle radar-circle-${i}`,
                }}
              />
            )}
 
            {/* Distance Label at circle edge */}
            <DistanceMarkings center={center} radiusKm={radiusKm} zoom={zoom} />
          </React.Fragment>
        );
      })}
 
      {/* Cardinal Directions (N, E, S, W) */}
      {zoom >= 12 && <CardinalDirections center={center} zoom={zoom} />}
 
      {/* North/East/South/West Axes */}
 
      {zoom >= 12 &&
        radarLines.map((line, idx) => (
          <Polyline
            key={idx}
            positions={line}
            pathOptions={{
              color: "#00ff41ff",
              weight: 2.5,
              opacity: 0.8,
              className: "radar-axis-line",
            }}
          />
        ))}

        
    </>
  );
};
 
export default RadarComponent;
 
 