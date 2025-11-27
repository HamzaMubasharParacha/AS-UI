import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
 
interface DrawnShape {
  id: string;
  type: string;
  name: string;
  layer: L.Layer;
  coordinates: any;
  properties: {
    color: string;
    fillColor: string;
    fillOpacity: number;
    weight: number;
    opacity: number;
  };
  measurements?: {
    area?: number;       // km²
    perimeter?: number;  // km
    distance?: number;   // km
  };
}
 
interface MapDrawingToolsProps {
  onShapeDrawn?: (shape: DrawnShape) => void;
  onShapeEdited?: (shapes: DrawnShape[]) => void;
  onShapeDeleted?: (deletedIds: string[]) => void;
}
 
const MapDrawingTools: React.FC<MapDrawingToolsProps> = ({
  onShapeDrawn,
  onShapeEdited,
  onShapeDeleted,
}) => {
  const map = useMap();
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup()).current;
 
  // -------------------------------------------------------------------
  // Initialize draw controls
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!map) return;
 
    map.addLayer(drawnItems);
 
    const drawControl = new (L as any).Control.Draw({
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
          icon: new L.Icon({
            iconUrl:
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOUM1IDE0LjI1IDEyIDIyIDEyIDIyQzEyIDIyIDE5IDE0LjI1IDE5IDlDMTkgNS4xMyAxNS44NyAyIDEyIDJaTTEyIDExLjVDMTAuNjIgMTEuNSA5LjUgMTAuMzggOS41IDlDOS41IDcuNjIgMTAuNjIgNi41IDEyIDYuNUMxMy4zOCA2LjUgMTQuNSA3LjYyIDE0LjUgOUMxNC41IDEwLjM4IDEzLjM4IDExLjUgMTIgMTEuNVoiIGZpbGw9IiMwMGZmNDEiLz48L3N2Zz4=",
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          }),
        },
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
 
    map.addControl(drawControl);
 
    map.on((L as any).Draw.Event.CREATED, handleShapeCreated);
    map.on((L as any).Draw.Event.EDITED, handleShapeEdited);
    map.on((L as any).Draw.Event.DELETED, handleShapeDeleted);
 
    return () => {
      map.removeControl(drawControl);
      map.off((L as any).Draw.Event.CREATED, handleShapeCreated);
      map.off((L as any).Draw.Event.EDITED, handleShapeEdited);
      map.off((L as any).Draw.Event.DELETED, handleShapeDeleted);
    };
  }, [map]);
 
  const commonPolygonStyle = () => ({
    color: "#00ff41",
    fillColor: "#00ff41",
    fillOpacity: 0.2,
    weight: 2,
    opacity: 0.8,
  });
 
  // -------------------------------------------------------------------
  // Shape Created
  // -------------------------------------------------------------------
  const handleShapeCreated = (e: any) => {
    const { layerType, layer } = e;
 
    const id = `shape_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
 
    drawnItems.addLayer(layer);
    (layer as any)._shapeId = id;
 
    const shape: DrawnShape = {
      id,
      type: layerType,
      name: `${layerType}_${id}`,
      layer,
      coordinates: getCoordinates(layer, layerType),
      properties: commonPolygonStyle(),
      measurements: calculateMeasurements(layer, layerType),
    };
 
    setShapes((prev) => [...prev, shape]);
 
    addShapePopup(layer, shape);
    onShapeDrawn?.(shape);
  };
 
  // -------------------------------------------------------------------
  // Shape Edited
  // -------------------------------------------------------------------
  const handleShapeEdited = (e: any) => {
    const updated: DrawnShape[] = [];
 
    e.layers.eachLayer((layer: any) => {
      const id = layer._shapeId;
      const original = shapes.find((s) => s.id === id);
      if (!original) return;
 
      const newShape = {
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
 
  // -------------------------------------------------------------------
  // Shape Deleted
  // -------------------------------------------------------------------
  const handleShapeDeleted = (e: any) => {
    const deletedIds: string[] = [];
 
    e.layers.eachLayer((layer: any) => {
      deletedIds.push(layer._shapeId);
    });
 
    setShapes((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
    onShapeDeleted?.(deletedIds);
  };
 
  // -------------------------------------------------------------------
  // Popup with Editable Name
  // -------------------------------------------------------------------
  const addShapePopup = (layer: any, shape: DrawnShape) => {
    const popupDiv = document.createElement("div");
    popupDiv.style.color = "#00ff41";
    popupDiv.style.fontFamily = "Courier New, monospace";
 
    const { area, perimeter, distance } = shape.measurements || {};
 
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
 
      <br/><br/>
 
      ${area !== undefined ? `<strong>Area:</strong> ${area.toFixed(3)} km²<br/>` : ""}
      ${perimeter !== undefined ? `<strong>Perimeter:</strong> ${perimeter.toFixed(3)} km<br/>` : ""}
      ${distance !== undefined ? `<strong>Distance:</strong> ${distance.toFixed(3)} km<br/>` : ""}
    `;
 
    layer.bindPopup(popupDiv, { className: "drawing-popup", maxWidth: 300 });
 
    layer.on("popupopen", () => {
      const popupEl = document.querySelector(".leaflet-popup");
      if (!popupEl) return;
 
      // remove previous button
      popupEl.querySelector("#edit-icon-btn")?.remove();
 
      // create edit button
      const editBtn = document.createElement("button");
      editBtn.id = "edit-icon-btn";
      editBtn.innerHTML = "✏️";
      editBtn.style.position = "absolute";
      editBtn.style.top = "4px";
      editBtn.style.right = "28px";
      editBtn.style.padding = "2px 6px";
      editBtn.style.cursor = "pointer";
      editBtn.style.fontSize = "12px";
 
      popupEl.appendChild(editBtn);
 
      // get name UI
      const nameText = popupDiv.querySelector("#shape-name-text") as HTMLElement;
      const nameInput = popupDiv.querySelector("#shape-name-input") as HTMLInputElement;
 
      // EDIT MODE
      const enableEdit = () => {
        nameText.style.display = "none";
        nameInput.style.display = "block";
        nameInput.focus();
        editBtn.innerHTML = "💾";
 
        editBtn.removeEventListener("click", enableEdit);
        editBtn.addEventListener("click", saveName);
      };
 
      // SAVE MODE
      const saveName = () => {
        const newName = nameInput.value;
        shape.name = newName;
 
        setShapes((prev) =>
          prev.map((s) => (s.id === shape.id ? { ...s, name: newName } : s))
        );
 
        addShapePopup(layer, shape);
        layer.openPopup();
      };
 
      editBtn.addEventListener("click", enableEdit);
    });
  };
 
  // -------------------------------------------------------------------
  // Coordinate Extraction
  // -------------------------------------------------------------------
  const getCoordinates = (layer: any, type: string) => {
    if (type === "polygon" || type === "rectangle")
      return layer.getLatLngs()[0].map((p: L.LatLng) => [p.lat, p.lng]);
 
    if (type === "polyline")
      return layer.getLatLngs().map((p: L.LatLng) => [p.lat, p.lng]);
 
    if (type === "circle") {
      const c = layer.getLatLng();
      return { center: [c.lat, c.lng], radius: layer.getRadius() };
    }
 
    if (type === "marker") {
      const p = layer.getLatLng();
      return [p.lat, p.lng];
    }
 
    return null;
  };
 
  // -------------------------------------------------------------------
  // Measurements (converted to km and km²)
  // -------------------------------------------------------------------
  const calculateMeasurements = (layer: any, type: string) => {
    const m: any = {};
 
    if (type === "polygon" || type === "rectangle") {
      const pts = layer.getLatLngs()[0];
 
      // perimeter (m → km)
      const perimeterMeters = pts.reduce(
        (acc: number, p1: any, i: number) =>
          acc + p1.distanceTo(pts[(i + 1) % pts.length]),
        0
      );
      m.perimeter = perimeterMeters / 1000;
 
      // area rough calculation → convert m² to km²
      const areaMeters2 = Math.abs(
        pts.reduce((sum: number, p: any, i: number) => {
          const j = (i + 1) % pts.length;
          return sum + p.lat * pts[j].lng - pts[j].lat * p.lng;
        }, 0) /
          2 *
          111320 *
          111320
      );
      m.area = areaMeters2 / 1_000_000;
    }
 
    if (type === "polyline") {
      const mDist = layer
        .getLatLngs()
        .reduce(
          (sum: number, p: any, i: number, arr: any[]) =>
            i === arr.length - 1 ? sum : sum + p.distanceTo(arr[i + 1]),
          0
        );
 
      m.distance = mDist / 1000;
    }
 
    if (type === "circle") {
      const r = layer.getRadius(); // meters
      m.area = (Math.PI * r * r) / 1_000_000;
      m.perimeter = (2 * Math.PI * r) / 1000;
    }
 
    return m;
  };
 
  return null;
};
 
export default MapDrawingTools;
export type { DrawnShape, MapDrawingToolsProps };
