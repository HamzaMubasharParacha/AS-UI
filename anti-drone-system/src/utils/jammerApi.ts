// utils/jammerApi.ts

interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

interface JammerStartRequest {
  frequencyBand: string;
  powerAttenuation: number;
  allSelectedBands: string[];
}

interface AntennaPositionRequest {
  command_type: "PTZ_CONTROL";
  ptz_azimuth: number;
  ptz_elevation: number;
}

// Get authentication token
const getToken = (): string => {
  const token = sessionStorage.getItem("token") || "";
  // if (!token) {
  //   throw new Error("Authentication token not found. Please login again.");
  // }
  return token;
};

// Start jammer
export const startJammer = async (requestBody: JammerStartRequest): Promise<ApiResponse> => {
  try {
    const token = getToken();
    const response = await fetch(
      "http://192.168.100.102:8080/api/jammer/1/jam/start",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error starting jammer:", error);
    throw error;
  }
};

// Stop jammer
export const stopJammer = async (): Promise<ApiResponse> => {
  try {
    const token = getToken();
    const response = await fetch(
      "http://192.168.100.102:8080/api/jammer/1/jam/stop",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error stopping jammer:", error);
    throw error;
  }
};

// Set antenna position
export const setAntennaPosition = async (
  requestBody: AntennaPositionRequest
): Promise<ApiResponse> => {
  try {
    const token = getToken();
    const response = await fetch(
      "http://192.168.100.102:8080/api/jammer/1/command",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error setting antenna position:", error);
    throw error;
  }
};

// Get jammer status (if your API supports it)
export const getJammerStatus = async (): Promise<ApiResponse> => {
  try {
    const token = getToken();
    const response = await fetch(
      "http://192.168.100.102:8080/api/jammer/1/status",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting jammer status:", error);
    throw error;
  }
};