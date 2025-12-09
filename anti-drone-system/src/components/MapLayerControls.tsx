import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "./MapLayerControls.css";
import { Button } from "@mui/material";

// Store selected layer outside the component to persist between mounts
let lastSelectedLayer: string = "Satellite";

interface MapLayerControlsProps {
  onLayerChange?: (layerName: string) => void;
}

const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  onLayerChange,
}) => {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string>(lastSelectedLayer);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const buttonRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Define tile layers
  const tileLayers = {
    OpenStreetMap: L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
      }
    ),
    Satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
      }
    ),
  };

  useEffect(() => {
    // Add initial layer
    tileLayers[lastSelectedLayer as keyof typeof tileLayers].addTo(map);

    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [map]);

  const handleLayerSelect = (layerName: string) => {
    // Remove current layer
    Object.values(tileLayers).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add new layer
    tileLayers[layerName as keyof typeof tileLayers].addTo(map);

    // Update states
    setSelectedLayer(layerName);
    lastSelectedLayer = layerName;

    // Notify parent
    if (onLayerChange) {
      onLayerChange(layerName);
    }

    // Close dropdown
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const getLayerIcon = (layerName: string) => {
    switch (layerName) {
      case "OpenStreetMap":
        return "🗺️";
      case "Satellite":
        return "🛰️";
      default:
        return "🗺️";
    }
  };

  return (
    <div className="map-layer-controls-container">
      {/* Main Button */}
      <Button
        ref={buttonRef}
        onClick={toggleDropdown}
        title="Select Map Type"
        sx={{
          backgroundColor: "rgba(0,0,0,0.2)",
          minWidth: "30px !important",
          width: "40px !important",
          height: "40px !important",
          padding: "0 !important",
          margin: "0 !important",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="button-icon">{getLayerIcon(selectedLayer)}</span>
        <span className="button-text">{selectedLayer}</span>
        <span className="button-arrow">{isOpen ? "▲" : "▼"}</span>
      </Button>
      {/* <div
        ref={buttonRef}
        className="map-type-button"
        onClick={toggleDropdown}
        title="Select Map Type"
      >
        <span className="button-icon">{getLayerIcon(selectedLayer)}</span>
        <span className="button-text">{selectedLayer}</span>
        <span className="button-arrow">{isOpen ? "▲" : "▼"}</span>
      </div> */}

      {/* Dropdown Menu */}
      {isOpen && (
        <div ref={dropdownRef} className="layer-dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">SELECT MAP TYPE</span>
            <button className="dropdown-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="layer-options">
            {Object.keys(tileLayers).map((layerName) => (
              <div
                key={layerName}
                className={`layer-option ${
                  selectedLayer === layerName ? "selected" : ""
                }`}
                onClick={() => handleLayerSelect(layerName)}
              >
                <span className="option-icon">{getLayerIcon(layerName)}</span>
                <span className="option-text">{layerName}</span>
                {selectedLayer === layerName && (
                  <span className="option-check">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLayerControls;
