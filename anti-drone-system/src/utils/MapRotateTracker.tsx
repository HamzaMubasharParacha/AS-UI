import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Map Rotate Tracker Component
export const MapRotateTracker: React.FC<{ onBearingChange: (bearing: number) => void }> = ({ onBearingChange }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleRotate = (e: any) => {
      // Try different methods to get bearing
      const leafletMap = map as any;
      let bearing = 0;
      
      if (leafletMap.getBearing) {
        bearing = leafletMap.getBearing();
      } else if (leafletMap.bearing !== undefined) {
        bearing = leafletMap.bearing;
      } else if (leafletMap.rotation !== undefined) {
        bearing = leafletMap.rotation;
      } else if (e.bearing !== undefined) {
        bearing = e.bearing;
      }
      
      onBearingChange(bearing);
    };

    // Listen to rotate events
    map.on('rotate', handleRotate);
    map.on('rotateend', handleRotate);
    
    // Initial bearing
    handleRotate({});

    return () => {
      map.off('rotate', handleRotate);
      map.off('rotateend', handleRotate);
    };
  }, [map, onBearingChange]);

  return null;
};