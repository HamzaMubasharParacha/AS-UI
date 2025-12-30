import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "./MapInformationControls.css";

interface MapInformationControlsProps {
  activeLayer?: string;
  isDarkMode?: boolean;
}

// Type for the custom Leaflet control
interface InfoControl extends L.Control {
  _container?: HTMLElement;
}

const MapInformationControls: React.FC<MapInformationControlsProps> = ({ activeLayer , isDarkMode }) => {
  const map = useMap();
  const infoControlRef = useRef<InfoControl | null>(null);

  useEffect(() => {
    // Create the Leaflet control once
    const Info = L.Control.extend({
      onAdd: (map: L.Map) => {
        const container = L.DomUtil.create("div", `${isDarkMode ? 'dark-map-info-control' : 'map-info-control'} asim leaflet-control`);

        container.innerHTML = `
          <div class="info-header"><b>Map Information</b></div>
          <div id="map-type"></div>
          <div id="zoom-level"></div>
          <div id="mouse-position"></div>
        `;

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      },
    });

    const infoControl = new Info({ position: "bottomleft" }) as InfoControl;
    infoControl.addTo(map);
    infoControlRef.current = infoControl;

    // Initial setup of zoom & mouse
    const zoomDiv = document.getElementById("zoom-level");
    const mouseDiv = document.getElementById("mouse-position");

    const updateZoom = () => {
      if (zoomDiv) {
        zoomDiv.innerHTML = `Zoom: <b>${map.getZoom()}</b>`;
      }
    };

    const updateMousePos = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (mouseDiv) {
        mouseDiv.innerHTML = `Cursor: <b>${lat.toFixed(4)}, ${lng.toFixed(4)}</b>`;
      }
    };

    updateZoom();

    map.on("zoomend", updateZoom);
    map.on("mousemove", updateMousePos);

    return () => {
      if (infoControlRef.current) {
        map.removeControl(infoControlRef.current);
      }
      map.off("zoomend", updateZoom);
      map.off("mousemove", updateMousePos);
    };
  }, [map , isDarkMode]);

  // Update active layer display whenever it changes
  useEffect(() => {
    const mapTypeDiv = document.getElementById("map-type");
    if (mapTypeDiv) {
      mapTypeDiv.innerHTML = `Type: <b>${activeLayer || "Sattelite"}</b>`;
    }
  }, [activeLayer]);

  return null;
};

export default MapInformationControls;