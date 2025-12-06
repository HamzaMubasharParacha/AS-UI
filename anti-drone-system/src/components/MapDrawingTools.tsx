import React, { useEffect, useRef, useState } from "react";
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

// Type for marker icons
// type MarkerIconType = keyof typeof MARKER_ICONS;

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
  const [currentMarkerIcon, setCurrentMarkerIcon] = useState<string>(defaultMarkerIcon);

  // Create icon from type
  const createIcon = (iconType: string = "default"): L.Icon => {
    const iconData = MARKER_ICONS[iconType as keyof typeof MARKER_ICONS];
    const encodedSVG = `data:image/svg+xml;base64,${btoa(iconData.html)}`;

    return new L.Icon({
      iconUrl: encodedSVG,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

  const commonPolygonStyle = (): L.PathOptions => ({
    color: "#00ff41",
    fillColor: "#00ff41",
    fillOpacity: 0.2,
    weight: 2,
    opacity: 0.8,
  });

  // Initialize draw controls
  useEffect(() => {
    if (!map) return;

    map.addLayer(drawnItems);

    // Create draw control options with proper typing
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
            color: "#00ff41",
            weight: 3,
            opacity: 0.8,
          },
          showLength: true,
        },
        circle: {
          shapeOptions: commonPolygonStyle(),
          showRadius: true,
        },
        marker: {
          icon: createIcon(currentMarkerIcon),
        },
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    };

    const drawControl = new (L.Control as any).Draw(drawOptions);
    map.addControl(drawControl);

    // Add custom icon selector control
    const iconControl = createIconSelectorControl();
    map.addControl(iconControl);

    const handleShapeCreated = (e: any) => {
      onShapeCreated(e);
    };

    const handleShapeEditedInternal = (e: any) => {
      onShapeEditedInternal(e);
    };

    const handleShapeDeletedInternal = (e: any) => {
      onShapeDeletedInternal(e);
    };

    map.on((L as any).Draw.Event.CREATED, handleShapeCreated);
    map.on((L as any).Draw.Event.EDITED, handleShapeEditedInternal);
    map.on((L as any).Draw.Event.DELETED, handleShapeDeletedInternal);

    return () => {
      map.removeControl(drawControl);
      map.removeControl(iconControl);
      map.off((L as any).Draw.Event.CREATED, handleShapeCreated);
      map.off((L as any).Draw.Event.EDITED, handleShapeEditedInternal);
      map.off((L as any).Draw.Event.DELETED, handleShapeDeletedInternal);
    };
  }, [map, currentMarkerIcon]);

  // Create Icon Selector Control with category tabs
  const createIconSelectorControl = (): L.Control => {
    const IconControl = L.Control.extend({
      options: {
        position: 'topright' as L.ControlPosition
      },

      onAdd: function(map: L.Map): HTMLElement {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.backgroundColor = 'white';
        container.style.padding = '5px';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        container.style.maxHeight = '500px';
        container.style.overflowY = 'auto';
        container.style.width = '250px';

        // Create category tabs
        type IconCategory = 'All' | 'Drone' | 'Radar' | 'Threat' | 'Zones' | 'Vehicles' | 'Stations' | 'Utilities';
        
        const allIcons = Object.entries(MARKER_ICONS) as [string, any][];
        
        const categories: Record<IconCategory, [string, any][]> = {
          'All': allIcons,
          'Drone': allIcons.filter(([key, data]) => 
            data.name.includes('Drone') || key.includes('drone')
          ),
          'Radar': allIcons.filter(([key, data]) => 
            data.name.includes('Radar') || data.name.includes('Sensor') || 
            key.includes('sensor') || key.includes('radar')
          ),
          'Threat': allIcons.filter(([key, data]) => 
            data.name.includes('Threat') || data.name.includes('Alert') ||
            key.includes('threat') || key.includes('alert')
          ),
          'Zones': allIcons.filter(([key, data]) => 
            data.name.includes('Zone') || key.includes('zone')
          ),
          'Vehicles': allIcons.filter(([key, data]) => 
            data.name.includes('Vehicle') || data.name.includes('Personnel') ||
            key.includes('vehicle') || key.includes('personnel')
          ),
          'Stations': allIcons.filter(([key, data]) => 
            data.name.includes('Center') || data.name.includes('Station') ||
            key.includes('station') || key.includes('center')
          ),
          'Utilities': allIcons.filter(([key, data]) => 
            data.name.includes('Utility') || data.name.includes('Settings') ||
            key.includes('utility') || key.includes('settings')
          )
        };

        // Tab container
        const tabContainer = L.DomUtil.create('div', '', container);
        tabContainer.style.display = 'flex';
        tabContainer.style.flexWrap = 'wrap';
        tabContainer.style.gap = '2px';
        tabContainer.style.marginBottom = '8px';
        tabContainer.style.paddingBottom = '5px';
        tabContainer.style.borderBottom = '1px solid #ddd';

        Object.keys(categories).forEach((category: string) => {
          const tab = L.DomUtil.create('button', '', tabContainer);
          tab.textContent = category;
          tab.style.flex = '1';
          tab.style.padding = '4px 6px';
          tab.style.fontSize = '10px';
          tab.style.border = '1px solid #ddd';
          tab.style.borderRadius = '3px';
          tab.style.cursor = 'pointer';
          tab.style.backgroundColor = category === 'All' ? '#f0f0f0' : 'white';

          tab.onclick = () => {
            // Update active tab
            Array.from(tabContainer.children).forEach((child: Element) => {
              (child as HTMLElement).style.backgroundColor = 'white';
            });
            tab.style.backgroundColor = '#f0f0f0';
            
            // Clear icons container
            iconsContainer.innerHTML = '';

            // Add icons for selected category
            categories[category as IconCategory].forEach(([key, iconData]) => {
              const iconDiv = L.DomUtil.create('div', '', iconsContainer);
              iconDiv.style.display = 'flex';
              iconDiv.style.alignItems = 'center';
              iconDiv.style.padding = '4px';
              iconDiv.style.cursor = 'pointer';
              iconDiv.style.marginBottom = '2px';
              iconDiv.style.borderRadius = '3px';

              if (key === currentMarkerIcon) {
                iconDiv.style.backgroundColor = '#f0f0f0';
              }

              iconDiv.onmouseover = () => {
                iconDiv.style.backgroundColor = '#f5f5f5';
              };
              iconDiv.onmouseout = () => {
                iconDiv.style.backgroundColor = key === currentMarkerIcon ? '#f0f0f0' : 'transparent';
              };

              iconDiv.onclick = () => {
                setCurrentMarkerIcon(key);
              };

              // Icon preview
              const iconPreview = L.DomUtil.create('div', '', iconDiv);
              iconPreview.innerHTML = iconData.html;
              iconPreview.style.width = '24px';
              iconPreview.style.height = '24px';
              iconPreview.style.marginRight = '8px';
              iconPreview.style.flexShrink = '0';

              // Icon name
              const iconName = L.DomUtil.create('div', '', iconDiv);
              iconName.textContent = iconData.name;
              iconName.style.fontSize = '11px';
              iconName.style.whiteSpace = 'nowrap';
              iconName.style.overflow = 'hidden';
              iconName.style.textOverflow = 'ellipsis';
            });
          };
        });

        // Icons container
        const iconsContainer = L.DomUtil.create('div', '', container);

        // Initialize with all icons
        categories['All'].forEach(([key, iconData]) => {
          const iconDiv = L.DomUtil.create('div', '', iconsContainer);
          iconDiv.style.display = 'flex';
          iconDiv.style.alignItems = 'center';
          iconDiv.style.padding = '4px';
          iconDiv.style.cursor = 'pointer';
          iconDiv.style.marginBottom = '2px';
          iconDiv.style.borderRadius = '3px';
          
          if (key === currentMarkerIcon) {
            iconDiv.style.backgroundColor = '#f0f0f0';
          }

          iconDiv.onmouseover = () => {
            iconDiv.style.backgroundColor = '#f5f5f5';
          };
          iconDiv.onmouseout = () => {
            iconDiv.style.backgroundColor = key === currentMarkerIcon ? '#f0f0f0' : 'transparent';
          };

          iconDiv.onclick = () => {
            setCurrentMarkerIcon(key);
          };

          // Icon preview
          const iconPreview = L.DomUtil.create('div', '', iconDiv);
          iconPreview.innerHTML = iconData.html;
          iconPreview.style.width = '24px';
          iconPreview.style.height = '24px';
          iconPreview.style.marginRight = '8px';
          iconPreview.style.flexShrink = '0';

          // Icon name
          const iconName = L.DomUtil.create('div', '', iconDiv);
          iconName.textContent = iconData.name;
          iconName.style.fontSize = '11px';
          iconName.style.whiteSpace = 'nowrap';
          iconName.style.overflow = 'hidden';
          iconName.style.textOverflow = 'ellipsis';
        });

        // Prevent map events when interacting with control
        L.DomEvent.disableClickPropagation(container);

        return container;
      }
    });

    return new IconControl();
  };

  // Shape Created
  const onShapeCreated = (e: any) => {
    const { layerType, layer } = e;

    const id = `shape_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    drawnItems.addLayer(layer);
    (layer as any)._shapeId = id;
    (layer as any)._iconType = currentMarkerIcon;

    const shape: Shape = {
      id,
      type: layerType,
      name: `${layerType}_${id}`,
      layer,
      coordinates: getCoordinates(layer, layerType),
      properties: {
        color: "#00ff41",
        fillColor: "#00ff41",
        fillOpacity: 0.2,
        weight: 2,
        opacity: 0.8,
      },
      measurements: calculateMeasurements(layer, layerType),
      // Store icon type for markers
      iconType: layerType === 'marker' ? currentMarkerIcon : undefined,
    };

    setShapes((prev) => [...prev, shape]);

    addShapePopup(layer, shape);
    onShapeDrawn?.(shape);
  };

  // Shape Edited
  const onShapeEditedInternal = (e: any) => {
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

  // Shape Deleted
  const onShapeDeletedInternal = (e: any) => {
    const deletedIds: string[] = [];

    e.layers.eachLayer((layer: L.Layer) => {
      deletedIds.push((layer as any)._shapeId);
    });

    setShapes((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
    onShapeDeleted?.(deletedIds);
  };

  // Popup with Editable Name and Icon Selection
  const addShapePopup = (layer: L.Layer, shape: Shape) => {
    const popupDiv = document.createElement("div");
    popupDiv.style.color = "#00ff41";
    popupDiv.style.fontFamily = "Courier New, monospace";

    const { area, perimeter, distance } = shape.measurements || {};

    // Check if this is a marker
    const isMarker = shape.type === 'marker';
    const currentIcon = isMarker ? (shape.iconType || 'default') : 'default';
    
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
             background:black;color:#00ff41;border:1px solid #00ff41;
             padding:4px;" />

      ${isMarker ? `
        <br/><br/>
        <strong>Icon:</strong>
        <div id="current-icon-display" style="margin-top:4px;">
          ${iconData.html}
          <span style="margin-left:8px;vertical-align:middle;">${iconData.name}</span>
        </div>
        <button id="change-icon-btn" 
                style="margin-top:6px;background:black;color:#00ff41;
                border:1px solid #00ff41;padding:4px 8px;cursor:pointer;">
          Change Icon
        </button>
      ` : ''}

      <br/><br/>

      ${area !== undefined ? `<strong>Area:</strong> ${area.toFixed(3)} km²<br/>` : ""}
      ${perimeter !== undefined ? `<strong>Perimeter:</strong> ${perimeter.toFixed(3)} km<br/>` : ""}
      ${distance !== undefined ? `<strong>Distance:</strong> ${distance.toFixed(3)} km<br/>` : ""}
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
      editBtn.innerHTML = "✏️ Edit Name";
      editBtn.style.position = "absolute";
      editBtn.style.top = "4px";
      editBtn.style.right = "28px";
      editBtn.style.padding = "2px 6px";
      editBtn.style.cursor = "pointer";
      editBtn.style.fontSize = "12px";

      popupEl.appendChild(editBtn);

      // Get name UI elements
      const nameText = popupDiv.querySelector("#shape-name-text");
      const nameInput = popupDiv.querySelector("#shape-name-input") as HTMLInputElement;

      // Get icon change button if marker
      const changeIconBtn = popupDiv.querySelector("#change-icon-btn");

      // EDIT NAME MODE
      const enableEdit = () => {
        (nameText as HTMLElement).style.display = "none";
        (nameInput as HTMLElement).style.display = "block";
        nameInput.focus();
        editBtn.innerHTML = "💾 Save";

        editBtn.removeEventListener("click", enableEdit);
        editBtn.addEventListener("click", saveName);
      };

      // SAVE NAME
      const saveName = () => {
        const newName = nameInput.value;
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
          iconSelector.style.backgroundColor = "white";
          iconSelector.style.padding = "15px";
          iconSelector.style.borderRadius = "8px";
          iconSelector.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
          iconSelector.style.zIndex = "1000";
          iconSelector.style.maxWidth = "300px";
          iconSelector.style.maxHeight = "400px";
          iconSelector.style.overflowY = "auto";

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
            iconOption.style.border = key === shape.iconType ? "2px solid #00ff41" : "1px solid #ddd";

            iconOption.onmouseover = () => {
              iconOption.style.backgroundColor = "#f5f5f5";
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
                prev.map((s) => 
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
  };

  // Coordinate Extraction
  const getCoordinates = (layer: L.Layer, type: string): any => {
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
  };

  // Measurements (converted to km and km²)
  const calculateMeasurements = (layer: L.Layer, type: string): ShapeMeasurements | undefined => {
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
          pts.reduce((sum: number, p: L.LatLng, i: number) => {
            const j = (i + 1) % pts.length;
            return sum + p.lat * pts[j].lng - pts[j].lat * p.lng;
          }, 0) /
            2 *
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
  };

  return null;
};

export default MapDrawingTools;
export { MARKER_ICONS };