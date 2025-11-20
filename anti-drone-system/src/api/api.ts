// src/api/api.ts
export interface DroneAPIResponse {
  id: string;
  image: string;
  name: string;
  state: string;
  direction: string;
  latitude: number | null;
  longitude: number | null;
  height: number | null;
  distance: number | null;
  speed: number | null;
  created_time: string;
}

export const fetchDrones = async (): Promise<DroneAPIResponse[]> => {
  try {
    const response = await fetch('http://192.168.21.121:8080/api/drone-detection/drone');
    const json = await response.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching drone data:', error);
    return [];
  }
};
