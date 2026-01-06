import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import "./SpooferControlPanel.css";
import {
  decept,
  forceLand,
  pause_decept,
  resume_decept,
  stop_decept,
} from "../api/config";
import { useEffect } from "react";

interface Coordinates {
  lat: number;
  lng: number;
  altitude: number;
}

interface SpooferControlPanelProps {
  setCoordinates: (coords: Coordinates) => void;
}

const SpooferControlPanel = ({ setCoordinates }: SpooferControlPanelProps) => {
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCoordinates();
    }, 3000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const fetchCoordinates = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(
        "http://192.168.100.102:8086/api/v1/spoofer/position/2",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add authorization if needed
            // Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Assuming your API returns latitude and longitude
      const fetchedCoords = {
        lat: data.position.latitude,
        lng: data.position.longitude,
        altitude: data.position.altitude,
      };

      setCoordinates(fetchedCoords);

      console.log("Fetched coordinates:", fetchedCoords);
      return fetchedCoords;
    } catch (err) {
      console.error("Error fetching coordinates:", err);
      return null;
    }
  };

  const callDecept = async () => {
    try {
      //   const token = sessionStorage.getItem("token");
      const response = await fetch(`${decept}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: 2,
          targetPosition: {
            latitude: 20.45,
            longitude: 20.45,
            altitude: 0,
          },
          speedMps: 30,
          intervalSeconds: 2,
          enableTransmitter: true,
          deceptionType: "LINEAR",
          durationSeconds: 1,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Force land response:", data);
    } catch (err) {
      console.error("Force Land API Error:", err);
    }
  };

  const callDeceptPause = async () => {
    try {
      //   const token = sessionStorage.getItem("token");
      const response = await fetch(`${pause_decept}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Pause Decept response:", data);
    } catch (err) {
      console.error("Pause Decept API Error:", err);
    }
  };

  const callDeceptResume = async () => {
    try {
      //   const token = sessionStorage.getItem("token");
      const response = await fetch(`${resume_decept}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Resume Decept response:", data);
    } catch (err) {
      console.error("Resume Decept API Error:", err);
    }
  };

  const callDeceptStop = async () => {
    try {
      //   const token = sessionStorage.getItem("token");
      const response = await fetch(`${stop_decept}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Stop Decept response:", data);
    } catch (err) {
      console.error("Stop Decept API Error:", err);
    }
  };

  const callForceLand = async () => {
    try {
      //   const token = sessionStorage.getItem("token");
      const response = await fetch(`${forceLand}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: 2,
          landingPosition: {
            latitude: 20,
            longitude: 20,
            altitude: 0,
          },
          descentRateMps: 30,
          enableTransmitter: true,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Force land response:", data);
    } catch (err) {
      console.error("Force Land API Error:", err);
    }
  };

  return (
    <Box className="spoofer-control-panel">
      <Typography>Spoofer Control Panel</Typography>
      <br></br>

      <ButtonGroup>
        <Button
          style={{ color: "#64b5f6" }} // Lighter blue
          onClick={() => {
            callDecept();
          }}
        >
          DECEPT
        </Button>
        <Button
          style={{ color: "#ffb74d" }} // Lighter orange
          onClick={() => {
            callForceLand();
          }}
        >
          FORCE LAND
        </Button>
      </ButtonGroup>
      <br></br>
      <ButtonGroup>
        <Button
          style={{ color: "#ffd54f" }} // Yellow
          onClick={() => {
            callDeceptPause();
          }}
        >
          PAUSE
        </Button>
        <Button
          style={{ color: "#a5d6a7" }} // Light green
          onClick={() => {
            callDeceptResume();
          }}
        >
          RESUME
        </Button>
        <Button
          style={{ color: "#e57373" }}
          onClick={() => {
            callDeceptStop();
          }}
        >
          STOP
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default SpooferControlPanel;
