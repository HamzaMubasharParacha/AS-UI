import React, { useEffect, useRef, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "./MapDrawingTools.css";
import { MARKER_ICONS } from "../utils/MarkerIcons";

// Define types for shapes
interface ShapeMeasurements {
  area?: number;
  perimeter?: number;
  distance?: number;
}

interface ShapeProperties {
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  opacity: number;
}

interface Shape {
  id: string;
  type: string;
  name: string;
  layer: L.Layer;
  coordinates: any;
  properties: ShapeProperties;
  measurements?: ShapeMeasurements;
  iconType?: string;
}

interface MapDrawingToolsProps {
  onShapeDrawn?: (shape: Shape) => void;
  onShapeEdited?: (shapes: Shape[]) => void;
  onShapeDeleted?: (shapeIds: string[]) => void;
  defaultMarkerIcon?: string;
}

const MapDrawingTools: React.FC<MapDrawingToolsProps> = ({
  onShapeDrawn,
  onShapeEdited,
  onShapeDeleted,
  defaultMarkerIcon = "default",
}) => {
  const map = useMap();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup()).current;

  // State for current marker icon selection
  const [currentMarkerIcon, setCurrentMarkerIcon] =
    useState<string>(defaultMarkerIcon);

  // State to control marker icon dropdown
  const [showMarkerIconDropdown, setShowMarkerIconDropdown] =
    useState<boolean>(false);

  // Track if we're in marker drawing mode
  const [isMarkerDrawingMode, setIsMarkerDrawingMode] =
    useState<boolean>(false);

  // Ref to store the currently selected icon
  const selectedIconRef = useRef<string>(defaultMarkerIcon);

  // Refs for controls
  const drawControlRef = useRef<any>(null);
  const markerControlRef = useRef<any>(null);
  const dropdownControlRef = useRef<any>(null);

  // Create icon from type
  const createIcon = useCallback((iconType: string = "default"): L.Icon => {
    const iconData = MARKER_ICONS[iconType as keyof typeof MARKER_ICONS];
    const encodedSVG = `data:image/svg+xml;base64,${btoa(iconData.html)}`;

    return new L.Icon({
      iconUrl: encodedSVG,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  }, []);

  // Common polygon style function
  const commonPolygonStyle = useCallback(
    (): L.PathOptions => ({
      color: "var(--primary-color)",
      fillColor: "var(--primary-color)",
      fillOpacity: 0.2,
      weight: 2,
      opacity: 0.8,
    }),
    []
  );

  // Handle marker icon change
  const handleMarkerIconChange = useCallback((iconType: string) => {
    setCurrentMarkerIcon(iconType);
    selectedIconRef.current = iconType;
  }, []);

    // Toggle marker drawing mode
  const toggleMarkerDrawingMode = useCallback(() => {
    const newMode = !isMarkerDrawingMode;
    setIsMarkerDrawingMode(newMode);
    
    // Always show dropdown when entering marker mode
    if (newMode) {
      setShowMarkerIconDropdown(true);
    } else {
      setShowMarkerIconDropdown(false);
    }
    
    // Update cursor
    if (map) {
      map.getContainer().style.cursor = newMode ? "crosshair" : "";
    }
  }, [isMarkerDrawingMode, map]);

  // Custom marker drawing handler
  const handleMapClickForMarker = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!isMarkerDrawingMode || !showMarkerIconDropdown) return;

      // Create marker with selected icon
      const icon = createIcon(selectedIconRef.current);
      const marker = L.marker(e.latlng, { icon });

      // Add to drawn items
      drawnItems.addLayer(marker);

      // Generate shape ID
      const id = `marker_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      (marker as any)._shapeId = id;
      (marker as any)._iconType = selectedIconRef.current;

      // Create shape object
      const shape: Shape = {
        id,
        type: "marker",
        name: `marker_${id}`,
        layer: marker,
        coordinates: [e.latlng.lat, e.latlng.lng],
        properties: {
          color: "var(--primary-color)",
          fillColor: "var(--primary-color)",
          fillOpacity: 0.2,
          weight: 2,
          opacity: 0.8,
        },
        iconType: selectedIconRef.current,
      };

      setShapes((prev) => [...prev, shape]);
      addShapePopup(marker, shape);
      onShapeDrawn?.(shape);

      // // Exit marker drawing mode after placing one marker
      // setIsMarkerDrawingMode(false);
      // setShowMarkerIconDropdown(false);
    },
    [isMarkerDrawingMode, showMarkerIconDropdown, createIcon, onShapeDrawn]
  );

  // Create a simple dropdown control
  const createDropdownControl = useCallback((): L.Control => {
    const DropdownControl = L.Control.extend({
      options: {
        position: "topright" as L.ControlPosition,
      },

      onAdd: function (map: L.Map): HTMLElement {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control custom-dropdown-control"
        );
        container.style.backgroundColor = "transparent";
        container.style.padding = "10px";
        container.style.borderRadius = "4px";
        container.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        container.style.width = "200px";
        container.style.maxHeight = "400px";
        container.style.overflowY = "auto";
        container.style.display = showMarkerIconDropdown ? "block" : "none";
        container.style.zIndex = "1000";
        container.style.marginRight = "60px"; // Make room for the marker button

        if (showMarkerIconDropdown) {
          // Title
          const title = document.createElement("div");
          title.textContent = "Select Marker Icon";
          title.style.fontWeight = "bold";
          title.style.marginBottom = "10px";
          title.style.textAlign = "center";
          title.style.fontSize = "14px";
          container.appendChild(title);

          // Simple icon grid - show all icons in a compact grid
          const iconGrid = document.createElement("div");
          iconGrid.style.display = "grid";
          iconGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
          iconGrid.style.gap = "5px";
          iconGrid.style.zIndex = "1009";
          iconGrid.style.maxHeight = "300px";
          iconGrid.style.overflowY = "auto";
          iconGrid.style.setProperty("scrollbar-width", "thin");
          iconGrid.style.setProperty("scrollbar-color", "rgba(0, 255, 65, 0.5) transparent");

          Object.entries(MARKER_ICONS).forEach(([key, iconData]) => {
            const iconButton = document.createElement("div");
            iconButton.className = "icon-option";
            iconButton.style.display = "flex";
            iconButton.style.flexDirection = "column";
            iconButton.style.alignItems = "center";
            iconButton.style.justifyContent = "center";
            iconButton.style.padding = "5px";
            iconButton.style.cursor = "pointer";
            iconButton.style.borderRadius = "3px";
            iconButton.style.border =
              key === currentMarkerIcon
                ? "2px solid var(--primary-color)"
                : "1px solid #ddd";
            iconButton.style.backgroundColor =
              key === currentMarkerIcon ? "transparent" : "transparent";
            iconButton.style.transition = "all 0.2s";

            iconButton.onmouseover = () => {
              iconButton.style.backgroundColor = "transparent";
            };

            iconButton.onmouseout = () => {
              iconButton.style.backgroundColor =
                key === currentMarkerIcon ? "transparent" : "transparent";
            };

            iconButton.onclick = () => {
              handleMarkerIconChange(key);
            };

            // Icon
            const icon = document.createElement("div");
            icon.innerHTML = iconData.html;
            icon.style.width = "16px";
            icon.style.height = "16px";
            icon.style.marginBottom = "2px";
            iconButton.appendChild(icon);

            // Icon name (abbreviated)
            const iconName = document.createElement("div");
            iconName.textContent = iconData.name.split(" ")[0];
            iconName.style.fontSize = "8px";
            iconName.style.textAlign = "center";
            iconName.style.whiteSpace = "nowrap";
            iconName.style.overflow = "hidden";
            iconName.style.textOverflow = "ellipsis";
            iconName.style.maxWidth = "100%";
            iconButton.appendChild(iconName);

            iconGrid.appendChild(iconButton);
          });

          container.appendChild(iconGrid);

          // Done button
          const doneButton = document.createElement("button");
          doneButton.textContent = "Done";
          doneButton.style.width = "100%";
          doneButton.style.marginTop = "10px";
          doneButton.style.padding = "8px";
          doneButton.style.cursor = "pointer";
          doneButton.style.border = "1px solid var(--primary-color)";
          doneButton.style.borderRadius = "4px";
          doneButton.style.backgroundColor = "var(--primary-color)";
          doneButton.style.color = "white";
          doneButton.style.fontWeight = "bold";

          doneButton.onclick = () => {
            setShowMarkerIconDropdown(false);
            setIsMarkerDrawingMode(false);
          };

          container.appendChild(doneButton);
        }

        // Prevent map events when interacting with control
        L.DomUtil.addClass(container, "leaflet-control");
        L.DomEvent.disableClickPropagation(container);

        return container;
      },

      onRemove: function () {
        // Empty to avoid errors
      },
    });

    return new DropdownControl();
  }, [showMarkerIconDropdown, currentMarkerIcon, handleMarkerIconChange]);

  // Create marker button control
  const createMarkerButtonControl = useCallback((): L.Control => {
    const MarkerButtonControl = L.Control.extend({
      options: {
        position: "topright" as L.ControlPosition,
      },

      onAdd: function (map: L.Map): HTMLElement {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control custom-marker-button"
        );
        container.style.backgroundColor = "transparent";
        container.style.padding = "5px";
        container.style.borderRadius = "0px";
        container.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";
        container.style.cursor = "pointer";

        // Create the marker button
        const markerButton = L.DomUtil.create("a", "", container);
        markerButton.href = "#";
        markerButton.title = "Draw Marker";
        markerButton.innerHTML = `
  <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="var(--primary-color)"/>
    </svg>
  </div>
        `;

        markerButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Toggle marker drawing mode
          if (isMarkerDrawingMode) {
            setIsMarkerDrawingMode(false);
            setShowMarkerIconDropdown(false);
          } else {
            setIsMarkerDrawingMode(true);
            setShowMarkerIconDropdown(true);
          }

          // Change cursor when in marker mode
          if (isMarkerDrawingMode) {
            map.getContainer().style.cursor = "";
          } else {
            map.getContainer().style.cursor = "crosshair";
          }
        };

        // Prevent map events when interacting with control
        L.DomUtil.addClass(container, "leaflet-control");
        L.DomEvent.disableClickPropagation(container);

        return container;
      },

      onRemove: function () {
        // Empty to avoid errors
      },
    });

    return new MarkerButtonControl();
  }, [isMarkerDrawingMode]);

  // Initialize everything
  useEffect(() => {
    if (!map) return;

    // Add drawn items layer
    map.addLayer(drawnItems);

    // Create and add draw control (without marker)
    const drawOptions: any = {
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: commonPolygonStyle(),
          showArea: true,
        },
        rectangle: {
          shapeOptions: commonPolygonStyle(),
          showArea: true,
        },
        polyline: {
          shapeOptions: {
            color: "var(--primary-color)",
            weight: 3,
            opacity: 0.8,
          },
          showLength: true,
        },
        circle: {
          shapeOptions: commonPolygonStyle(),
          showRadius: true,
        },
        marker: false, // Disable Leaflet's marker
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    };

    const drawControl = new (L.Control as any).Draw(drawOptions);
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // Create and add marker button
    const markerButtonControl = createMarkerButtonControl();
    map.addControl(markerButtonControl);
    markerControlRef.current = markerButtonControl;

    // Create dropdown control (will be shown/hidden based on state)
    const dropdownControl = createDropdownControl();
    map.addControl(dropdownControl);

    // Handle drawing events for non-marker shapes
    const handleShapeCreated = (e: any) => {
      const { layerType, layer } = e;

      if (layerType === "marker") return; // Skip markers from Leaflet draw

      const id = `shape_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      drawnItems.addLayer(layer);
      (layer as any)._shapeId = id;

      const shape: Shape = {
        id,
        type: layerType,
        name: `${layerType}_${id}`,
        layer,
        coordinates: getCoordinates(layer, layerType),
        properties: {
          color: "var(--primary-color)",
          fillColor: "var(--primary-color)",
          fillOpacity: 0.2,
          weight: 2,
          opacity: 0.8,
        },
        measurements: calculateMeasurements(layer, layerType),
      };

      setShapes((prev) => [...prev, shape]);
      addShapePopup(layer, shape);
      onShapeDrawn?.(shape);
    };

    const handleShapeEditedInternal = (e: any) => {
      const updated: Shape[] = [];

      e.layers.eachLayer((layer: L.Layer) => {
        const id = (layer as any)._shapeId;
        const original = shapes.find((s) => s.id === id);
        if (!original) return;

        const newShape: Shape = {
          ...original,
          coordinates: getCoordinates(layer, original.type),
          measurements: calculateMeasurements(layer, original.type),
        };

        updated.push(newShape);
        addShapePopup(layer, newShape);
      });

      setShapes((prev) =>
        prev.map((s) => updated.find((x) => x.id === s.id) || s)
      );

      onShapeEdited?.(updated);
    };

    const handleShapeDeletedInternal = (e: any) => {
      const deletedIds: string[] = [];

      e.layers.eachLayer((layer: L.Layer) => {
        deletedIds.push((layer as any)._shapeId);
      });

      setShapes((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
      onShapeDeleted?.(deletedIds);
    };

    // Set up click handler for custom marker drawing
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      handleMapClickForMarker(e);
    };

    // Add map click listener for markers
    map.on("click", handleMapClick);

    // Add Leaflet draw event listeners
    map.on((L as any).Draw.Event.CREATED, handleShapeCreated);
    map.on((L as any).Draw.Event.EDITED, handleShapeEditedInternal);
    map.on((L as any).Draw.Event.DELETED, handleShapeDeletedInternal);

    return () => {
      // Cleanup
      map.off("click", handleMapClick);
      map.off((L as any).Draw.Event.CREATED, handleShapeCreated);
      map.off((L as any).Draw.Event.EDITED, handleShapeEditedInternal);
      map.off((L as any).Draw.Event.DELETED, handleShapeDeletedInternal);

      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }

      if (markerControlRef.current) {
        map.removeControl(markerControlRef.current);
      }

      // Remove any custom dropdown controls
      const dropdowns = document.querySelectorAll(".custom-dropdown-control");
      dropdowns.forEach((dropdown) => dropdown.remove());
    };
  }, [
    map,
    createMarkerButtonControl,
    createDropdownControl,
    commonPolygonStyle,
    handleMapClickForMarker,
    onShapeDrawn,
    onShapeEdited,
    onShapeDeleted,
    shapes,
  ]);

  // Update cursor when marker drawing mode changes
  useEffect(() => {
    if (!map) return;

    if (isMarkerDrawingMode) {
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.getContainer().style.cursor = "";
    }
  }, [map, isMarkerDrawingMode]);

  // Helper functions
  const getCoordinates = useCallback((layer: L.Layer, type: string): any => {
    if (type === "polygon" || type === "rectangle") {
      const polygonLayer = layer as L.Polygon;
      const latLngs = polygonLayer.getLatLngs();
      if (Array.isArray(latLngs[0])) {
        const points = latLngs[0] as L.LatLng[];
        return points.map((p: L.LatLng) => [p.lat, p.lng]);
      }
      return [];
    }

    if (type === "polyline") {
      const polylineLayer = layer as L.Polyline;
      const points = polylineLayer.getLatLngs() as L.LatLng[];
      return points.map((p: L.LatLng) => [p.lat, p.lng]);
    }

    if (type === "circle") {
      const circleLayer = layer as L.Circle;
      const c = circleLayer.getLatLng();
      return { center: [c.lat, c.lng], radius: circleLayer.getRadius() };
    }

    if (type === "marker") {
      const markerLayer = layer as L.Marker;
      const p = markerLayer.getLatLng();
      return [p.lat, p.lng];
    }

    return null;
  }, []);

  const calculateMeasurements = useCallback(
    (layer: L.Layer, type: string): ShapeMeasurements | undefined => {
      const m: ShapeMeasurements = {};

      if (type === "polygon" || type === "rectangle") {
        const polygonLayer = layer as L.Polygon;
        const latLngs = polygonLayer.getLatLngs();

        if (Array.isArray(latLngs[0])) {
          const pts = latLngs[0] as L.LatLng[];

          // perimeter (m → km)
          const perimeterMeters = pts.reduce(
            (acc: number, p1: L.LatLng, i: number) =>
              acc + p1.distanceTo(pts[(i + 1) % pts.length]),
            0
          );
          m.perimeter = perimeterMeters / 1000;

          // area rough calculation → convert m² to km²
          const areaMeters2 = Math.abs(
            (pts.reduce((sum: number, p: L.LatLng, i: number) => {
              const j = (i + 1) % pts.length;
              return sum + p.lat * pts[j].lng - pts[j].lat * p.lng;
            }, 0) /
              2) *
              111320 *
              111320
          );
          m.area = areaMeters2 / 1_000_000;
        }
      }

      if (type === "polyline") {
        const polylineLayer = layer as L.Polyline;
        const points = polylineLayer.getLatLngs() as L.LatLng[];

        const mDist = points.reduce(
          (sum: number, p: L.LatLng, i: number, arr: L.LatLng[]) =>
            i === arr.length - 1 ? sum : sum + p.distanceTo(arr[i + 1]),
          0
        );

        m.distance = mDist / 1000;
      }

      if (type === "circle") {
        const circleLayer = layer as L.Circle;
        const r = circleLayer.getRadius(); // meters
        m.area = (Math.PI * r * r) / 1_000_000;
        m.perimeter = (2 * Math.PI * r) / 1000;
      }

      return Object.keys(m).length > 0 ? m : undefined;
    },
    []
  );

  const addShapePopup = useCallback(
    (layer: L.Layer, shape: Shape) => {
      const popupDiv = document.createElement("div");
      popupDiv.style.color = "var(--primary-color)";
      popupDiv.style.fontFamily = "Courier New, monospace";

      const { area, perimeter, distance } = shape.measurements || {};

      // Check if this is a marker
      const isMarker = shape.type === "marker";
      const currentIcon = isMarker ? shape.iconType || "default" : "default";

      const iconData = MARKER_ICONS[currentIcon as keyof typeof MARKER_ICONS];

      popupDiv.innerHTML = `
      <strong>${shape.type.toUpperCase()}</strong><br/>
      <strong>ID:</strong> ${shape.id}<br/><br/>

      <strong>Name:</strong>
      <span id="shape-name-text">${shape.name}</span>
      <input id="shape-name-input"
             type="text"
             value="${shape.name}"
             style="display:none;width:100%;margin-top:6px;
             background:black;color:var(--primary-color);border:1px solid var(--primary-color);
             padding:4px;" />

      ${
        isMarker
          ? `
        <br/><br/>
        <strong>Icon:</strong>
        <div id="current-icon-display" style="margin-top:4px;">
          ${iconData.html}
          <span style="margin-left:8px;vertical-align:middle;">${iconData.name}</span>
        </div>
        <button id="change-icon-btn" 
                style="margin-top:6px;background:black;color:var(--primary-color);
                border:1px solid var(--primary-color);padding:4px 8px;cursor:pointer;">
          Change Icon
        </button>
      `
          : ""
      }

      <br/><br/>

      ${
        area !== undefined
          ? `<strong>Area:</strong> ${area.toFixed(3)} km²<br/>`
          : ""
      }
      ${
        perimeter !== undefined
          ? `<strong>Perimeter:</strong> ${perimeter.toFixed(3)} km<br/>`
          : ""
      }
      ${
        distance !== undefined
          ? `<strong>Distance:</strong> ${distance.toFixed(3)} km<br/>`
          : ""
      }
    `;

      layer.bindPopup(popupDiv, { className: "drawing-popup", maxWidth: 300 });

      layer.on("popupopen", () => {
        const popupEl = document.querySelector(".leaflet-popup");
        if (!popupEl) return;

        // Remove previous buttons
        popupEl.querySelector("#edit-icon-btn")?.remove();

        // Create edit button for name
        const editBtn = document.createElement("button");
        editBtn.id = "edit-icon-btn";
        editBtn.innerHTML = "Edit Name";
        editBtn.style.position = "absolute";
        editBtn.style.color = "#ffffff";
        editBtn.style.top = "4px";
        editBtn.style.right = "28px";
        editBtn.style.padding = "2px 6px";
        editBtn.style.cursor = "pointer";
        editBtn.style.fontSize = "12px";
        editBtn.style.background = "#21231b";
        editBtn.style.border = "1px solid var(--primary-color)";

        popupEl.appendChild(editBtn);

        // Get name UI elements
        const nameText = popupDiv.querySelector("#shape-name-text");
        const nameInput = popupDiv.querySelector(
          "#shape-name-input"
        ) as HTMLInputElement;

        // Get icon change button if marker
        const changeIconBtn = popupDiv.querySelector("#change-icon-btn");

        // EDIT NAME MODE
        const enableEdit = () => {
          if (nameText) (nameText as HTMLElement).style.display = "none";
          if (nameInput) (nameInput as HTMLElement).style.display = "block";
          if (nameInput) nameInput.focus();
          editBtn.innerHTML = "Save";

          editBtn.removeEventListener("click", enableEdit);
          editBtn.addEventListener("click", saveName);
        };

        // SAVE NAME
        const saveName = () => {
          const newName = nameInput ? nameInput.value : shape.name;
          shape.name = newName;

          setShapes((prev) =>
            prev.map((s) => (s.id === shape.id ? { ...s, name: newName } : s))
          );

          addShapePopup(layer, shape);
          layer.openPopup();
        };

        // CHANGE ICON (for markers only)
        if (changeIconBtn && isMarker) {
          changeIconBtn.addEventListener("click", () => {
            const iconSelector = document.createElement("div");
            iconSelector.style.position = "fixed";
            iconSelector.style.top = "50%";
            iconSelector.style.left = "50%";
            iconSelector.style.transform = "translate(-50%, -50%)";
            iconSelector.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            iconSelector.style.padding = "15px";
            iconSelector.style.border = "1px solid var(--primary-color)";
            iconSelector.style.borderRadius = "8px";
            iconSelector.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
            iconSelector.style.zIndex = "1000";
            iconSelector.style.maxWidth = "300px";
            iconSelector.style.maxHeight = "400px";
            iconSelector.style.overflowY = "auto";
            iconSelector.style.setProperty("scrollbar-width", "thin");
            iconSelector.style.setProperty(
              "scrollbar-color",
              "rgba(0, 255, 65, 0.5) transparent"
            );

            const title = document.createElement("div");
            title.innerHTML = "<strong>Select Icon</strong>";
            title.style.marginBottom = "10px";
            title.style.textAlign = "center";
            iconSelector.appendChild(title);

            Object.entries(MARKER_ICONS).forEach(([key, iconData]) => {
              const iconOption = document.createElement("div");
              iconOption.style.display = "flex";
              iconOption.style.alignItems = "center";
              iconOption.style.padding = "8px";
              iconOption.style.cursor = "pointer";
              iconOption.style.marginBottom = "4px";
              iconOption.style.borderRadius = "4px";
              iconOption.style.border =
                key === shape.iconType ? "2px solid var(--primary-color)" : "1px solid #ddd";

              iconOption.onmouseover = () => {
                iconOption.style.backgroundColor = "transparent";
              };
              iconOption.onmouseout = () => {
                iconOption.style.backgroundColor = "transparent";
              };

              iconOption.onclick = () => {
                // Update marker icon
                shape.iconType = key;
                const newIcon = createIcon(key);
                (layer as L.Marker).setIcon(newIcon);

                // Update shape data
                setShapes((prev) =>
                  prev.map((s: Shape) =>
                    s.id === shape.id ? { ...s, iconType: key } : s
                  )
                );

                // Update popup
                addShapePopup(layer, shape);
                layer.openPopup();

                // Remove selector
                document.body.removeChild(iconSelector);
              };

              // Icon preview
              const iconPreview = document.createElement("div");
              iconPreview.innerHTML = iconData.html;
              iconPreview.style.width = "24px";
              iconPreview.style.height = "24px";
              iconPreview.style.marginRight = "12px";
              iconPreview.style.flexShrink = "0";

              // Icon name
              const iconName = document.createElement("div");
              iconName.textContent = iconData.name;
              iconName.style.fontSize = "14px";

              iconOption.appendChild(iconPreview);
              iconOption.appendChild(iconName);
              iconSelector.appendChild(iconOption);
            });

            const closeBtn = document.createElement("button");
            closeBtn.textContent = "Close";
            closeBtn.style.marginTop = "10px";
            closeBtn.style.padding = "6px 12px";
            closeBtn.style.cursor = "pointer";
            closeBtn.style.width = "100%";
            closeBtn.onclick = () => {
              document.body.removeChild(iconSelector);
            };
            iconSelector.appendChild(closeBtn);

            document.body.appendChild(iconSelector);
          });
        }

        editBtn.addEventListener("click", enableEdit);
      });
    },
    [createIcon]
  );

  return null;
};

export default MapDrawingTools;
export { MARKER_ICONS };
