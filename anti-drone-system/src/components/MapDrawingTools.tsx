import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawnShape {
  id: string;
  type: string;
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
    area?: number;
    perimeter?: number;
    distance?: number;
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
  onShapeDeleted
}) => {
  const map = useMap();
  const [drawControl, setDrawControl] = useState<any>(null);
  const [drawnItems, setDrawnItems] = useState<L.FeatureGroup>(new L.FeatureGroup());
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const drawControlRef = useRef<any>(null);

  // Initialize drawing tools
  useEffect(() => {
    if (!map) return;

    // Add drawn items layer to map
    map.addLayer(drawnItems);

    // Configure drawing options
    const drawOptions = {
      position: 'topright' as L.ControlPosition,
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#00ff41',
            fillColor: '#00ff41',
            fillOpacity: 0.2,
            weight: 2,
            opacity: 0.8
          },
          showArea: true,
          metric: true,
          feet: false,
          nautic: false
        },
        polyline: {
          shapeOptions: {
            color: '#00ff41',
            weight: 3,
            opacity: 0.8
          },
          metric: true,
          feet: false,
          nautic: false,
          showLength: true
        },
        rectangle: {
          shapeOptions: {
            color: '#00ff41',
            fillColor: '#00ff41',
            fillOpacity: 0.2,
            weight: 2,
            opacity: 0.8
          },
          showArea: true,
          metric: true
        },
        circle: {
          shapeOptions: {
            color: '#00ff41',
            fillColor: '#00ff41',
            fillOpacity: 0.2,
            weight: 2,
            opacity: 0.8
          },
          showRadius: true,
          metric: true,
          feet: false,
          nautic: false
        },
        marker: {
          icon: new L.Icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjMDBmZjQxIi8+Cjwvc3ZnPgo=',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24]
          })
        },
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
        edit: {}
      }
    };

    // Create and add draw control
    const control = new (L as any).Control.Draw(drawOptions);
    map.addControl(control);
    setDrawControl(control);
    drawControlRef.current = control;

    // Event handlers
    const onDrawCreated = (e: any) => {
      const { layerType, layer } = e;
      const shapeId = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add layer to drawn items
      drawnItems.addLayer(layer);
      
      // Calculate measurements
      let measurements: any = {};
      if (layerType === 'polygon' || layerType === 'rectangle') {
        const latlngs = layer.getLatLngs()[0];
        measurements.area = calculatePolygonArea(latlngs);
        measurements.perimeter = calculatePerimeter(latlngs);
      } else if (layerType === 'polyline') {
        measurements.distance = calculateDistance(layer.getLatLngs());
      } else if (layerType === 'circle') {
        const radius = layer.getRadius();
        measurements.area = Math.PI * radius * radius;
        measurements.perimeter = 2 * Math.PI * radius;
      }

      // Create shape object
      const shape: DrawnShape = {
        id: shapeId,
        type: layerType,
        layer: layer,
        coordinates: getCoordinates(layer, layerType),
        properties: {
          color: '#00ff41',
          fillColor: '#00ff41',
          fillOpacity: 0.2,
          weight: 2,
          opacity: 0.8
        },
        measurements
      };

      // Store shape ID in layer
      (layer as any)._shapeId = shapeId;

      // Update shapes state
      setShapes(prev => [...prev, shape]);

      // Add popup with information
      addShapePopup(layer, shape);

      // Callback
      if (onShapeDrawn) {
        onShapeDrawn(shape);
      }

      console.log(`Created ${layerType}:`, shape);
    };

    const onDrawEdited = (e: any) => {
      const editedShapes: DrawnShape[] = [];
      
      e.layers.eachLayer((layer: any) => {
        const shapeId = layer._shapeId;
        if (shapeId) {
          const existingShape = shapes.find(s => s.id === shapeId);
          if (existingShape) {
            // Update coordinates and measurements
            const updatedShape = {
              ...existingShape,
              coordinates: getCoordinates(layer, existingShape.type),
              measurements: calculateMeasurements(layer, existingShape.type)
            };
            editedShapes.push(updatedShape);
            
            // Update popup
            addShapePopup(layer, updatedShape);
          }
        }
      });

      // Update shapes state
      setShapes(prev => prev.map(shape => {
        const edited = editedShapes.find(s => s.id === shape.id);
        return edited || shape;
      }));

      if (onShapeEdited && editedShapes.length > 0) {
        onShapeEdited(editedShapes);
      }
    };

    const onDrawDeleted = (e: any) => {
      const deletedIds: string[] = [];
      
      e.layers.eachLayer((layer: any) => {
        const shapeId = layer._shapeId;
        if (shapeId) {
          deletedIds.push(shapeId);
        }
      });

      // Update shapes state
      setShapes(prev => prev.filter(shape => !deletedIds.includes(shape.id)));

      if (onShapeDeleted && deletedIds.length > 0) {
        onShapeDeleted(deletedIds);
      }
    };

    // Add event listeners
    map.on((L as any).Draw.Event.CREATED, onDrawCreated);
    map.on((L as any).Draw.Event.EDITED, onDrawEdited);
    map.on((L as any).Draw.Event.DELETED, onDrawDeleted);

    // Cleanup
    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      map.removeLayer(drawnItems);
      map.off((L as any).Draw.Event.CREATED, onDrawCreated);
      map.off((L as any).Draw.Event.EDITED, onDrawEdited);
      map.off((L as any).Draw.Event.DELETED, onDrawDeleted);
    };
  }, [map, drawnItems, shapes, onShapeDrawn, onShapeEdited, onShapeDeleted]);

  // Helper functions
  const getCoordinates = (layer: any, type: string) => {
    switch (type) {
      case 'polygon':
      case 'rectangle':
        return layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
      case 'polyline':
        return layer.getLatLngs().map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
      case 'circle':
        const center = layer.getLatLng();
        return {
          center: [center.lat, center.lng],
          radius: layer.getRadius()
        };
      case 'marker':
        const pos = layer.getLatLng();
        return [pos.lat, pos.lng];
      default:
        return null;
    }
  };

  const calculateMeasurements = (layer: any, type: string) => {
    const measurements: any = {};
    
    if (type === 'polygon' || type === 'rectangle') {
      const latlngs = layer.getLatLngs()[0];
      measurements.area = calculatePolygonArea(latlngs);
      measurements.perimeter = calculatePerimeter(latlngs);
    } else if (type === 'polyline') {
      measurements.distance = calculateDistance(layer.getLatLngs());
    } else if (type === 'circle') {
      const radius = layer.getRadius();
      measurements.area = Math.PI * radius * radius;
      measurements.perimeter = 2 * Math.PI * radius;
    }
    
    return measurements;
  };

  const calculatePolygonArea = (latlngs: L.LatLng[]) => {
    // Simple polygon area calculation using shoelace formula
    let area = 0;
    const n = latlngs.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += latlngs[i].lat * latlngs[j].lng;
      area -= latlngs[j].lat * latlngs[i].lng;
    }
    
    return Math.abs(area / 2) * 111320 * 111320; // Rough conversion to square meters
  };

  const calculatePerimeter = (latlngs: L.LatLng[]) => {
    let perimeter = 0;
    for (let i = 0; i < latlngs.length; i++) {
      const current = latlngs[i];
      const next = latlngs[(i + 1) % latlngs.length];
      perimeter += current.distanceTo(next);
    }
    return perimeter;
  };

  const calculateDistance = (latlngs: L.LatLng[]) => {
    let distance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      distance += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    return distance;
  };

  const formatMeasurement = (value: number, unit: string) => {
    if (unit === 'area') {
      if (value < 1000000) {
        return `${Math.round(value)} m²`;
      } else {
        return `${(value / 1000000).toFixed(2)} km²`;
      }
    } else {
      if (value < 1000) {
        return `${Math.round(value)} m`;
      } else {
        return `${(value / 1000).toFixed(2)} km`;
      }
    }
  };

  const addShapePopup = (layer: any, shape: DrawnShape) => {
    let popupContent = `<div style="color: #00ff41; font-family: 'Courier New', monospace;">`;
    popupContent += `<strong>${shape.type.toUpperCase()}</strong><br/>`;
    popupContent += `<strong>ID:</strong> ${shape.id}<br/>`;
    
    if (shape.measurements) {
      if (shape.measurements.area !== undefined) {
        popupContent += `<strong>Area:</strong> ${formatMeasurement(shape.measurements.area, 'area')}<br/>`;
      }
      if (shape.measurements.perimeter !== undefined) {
        popupContent += `<strong>Perimeter:</strong> ${formatMeasurement(shape.measurements.perimeter, 'distance')}<br/>`;
      }
      if (shape.measurements.distance !== undefined) {
        popupContent += `<strong>Distance:</strong> ${formatMeasurement(shape.measurements.distance, 'distance')}<br/>`;
      }
    }
    
    popupContent += `</div>`;
    
    layer.bindPopup(popupContent, {
      className: 'drawing-popup',
      maxWidth: 300
    });
  };

  // Public methods for external control
  const enableDrawingTool = (toolType: string) => {
    setActiveDrawingTool(toolType);
    // Programmatically trigger drawing mode
    const toolbar = (drawControl as any)?._toolbars?.draw;
    if (toolbar) {
      const tool = toolbar._modes[toolType];
      if (tool && tool.handler) {
        tool.handler.enable();
      }
    }
  };

  const disableDrawingTool = () => {
    setActiveDrawingTool(null);
    // Disable all drawing modes
    const toolbar = (drawControl as any)?._toolbars?.draw;
    if (toolbar) {
      Object.values(toolbar._modes).forEach((mode: any) => {
        if (mode.handler) {
          mode.handler.disable();
        }
      });
    }
  };

  const clearAllShapes = () => {
    drawnItems.clearLayers();
    setShapes([]);
    if (onShapeDeleted) {
      onShapeDeleted(shapes.map(s => s.id));
    }
  };

  const exportShapes = () => {
    const geoJsonData = {
      type: 'FeatureCollection',
      features: shapes.map(shape => ({
        type: 'Feature',
        properties: {
          id: shape.id,
          type: shape.type,
          ...shape.properties,
          measurements: shape.measurements
        },
        geometry: convertToGeoJSON(shape)
      }))
    };
    
    return geoJsonData;
  };

  const convertToGeoJSON = (shape: DrawnShape) => {
    switch (shape.type) {
      case 'polygon':
      case 'rectangle':
        return {
          type: 'Polygon',
          coordinates: [shape.coordinates.map((coord: number[]) => [coord[1], coord[0]])]
        };
      case 'polyline':
        return {
          type: 'LineString',
          coordinates: shape.coordinates.map((coord: number[]) => [coord[1], coord[0]])
        };
      case 'circle':
        return {
          type: 'Point',
          coordinates: [shape.coordinates.center[1], shape.coordinates.center[0]]
        };
      case 'marker':
        return {
          type: 'Point',
          coordinates: [shape.coordinates[1], shape.coordinates[0]]
        };
      default:
        return null;
    }
  };

  // Expose methods for external access
  React.useEffect(() => {
    (MapDrawingTools as any).currentInstance = {
      enableDrawingTool,
      disableDrawingTool,
      clearAllShapes,
      exportShapes,
      shapes,
      activeDrawingTool
    };
  }, [enableDrawingTool, disableDrawingTool, clearAllShapes, exportShapes, shapes, activeDrawingTool]);

  return null; // This component doesn't render anything directly
};

export default MapDrawingTools;
export type { DrawnShape, MapDrawingToolsProps };