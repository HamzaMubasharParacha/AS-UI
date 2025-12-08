import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Checkbox,
  Button,
} from "@mui/material";
import "./JammerControlPanel.css";
import PTZControls from "./PTZControls";

// Types
interface JammerControlPanelProps {
  coneangle: number;
  coneelevation: number;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

interface SectorJammingConfig {
  startAngle: number;
  stopAngle: number;
  stepSize: number;
  direction: "forward" | "backward";
  isActive: boolean;
  intervalId: NodeJS.Timeout | null;
  currentAngle: number;
}

// Enhanced getToken function with fallback
const getToken = () => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }
  return token;
};

// Frequency Checkboxes Component
const FrequencyCheckboxes: React.FC<{
  frequencies: Record<string, boolean>;
  onFrequencyChange: (frequency: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  jammerStatus: "idle" | "starting" | "active" | "stopping";
}> = ({ frequencies, onFrequencyChange, jammerStatus }) => {
  const isDisabled = jammerStatus === "active" || jammerStatus === "starting" || jammerStatus === "stopping";

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: "#00ff41",
          mb: 1,
          fontWeight: "bold",
          fontSize: "12px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        JAMMING BANDS
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {Object.keys(frequencies).map((frequency) => (
          <Box
            key={frequency}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              margin: 0,
              padding: "4px",
              minWidth: "40px",
              "&:hover": {
                backgroundColor: "rgba(0, 255, 65, 0.1)",
                borderRadius: 1,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "10px",
                fontFamily: "monospace",
                color: isDisabled ? "rgba(255, 255, 255, 0.7)" : "#fff",
                mb: 0.5,
                textAlign: "center",
              }}
            >
              {frequency}
            </Typography>

            <Checkbox
              size="small"
              checked={frequencies[frequency]}
              onChange={onFrequencyChange(frequency)}
              disabled={isDisabled}
              sx={{
                color: "#00ff41",
                "&.Mui-checked": {
                  color: "#00ff41",
                },
                "&.Mui-disabled": {
                  color: "rgba(0, 255, 65, 0.5)",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: 14,
                },
                padding: "2px",
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Main Jammer Control Panel Component
const JammerControlPanel: React.FC<JammerControlPanelProps> = ({
  coneangle,
  coneelevation,
  onError,
  onSuccess,
}) => {
  // Jammer state management
  const [jammerStatus, setJammerStatus] = useState<
    "idle" | "starting" | "active" | "stopping"
  >("idle");
  
  const [selectedFrequencies, setSelectedFrequencies] = useState<
    Record<string, boolean>
  >({
    "5.8GHz": false,
    "5.2GHz": false,
    "4.0GHz": false,
    "2.4GHz": false,
    "1.4GHz": false,
    "<1GHz": false,
  });

  const [showPtzControls, setShowPtzControls] = useState(false);
  const [azimuthValue, setAzimuthValue] = useState<string>(coneangle.toString());
  const [elevationValue, setElevationValue] = useState<string>(coneelevation.toString());

  // Sector jamming state
  const [sectorJammingEnabled, setSectorJammingEnabled] = useState(false);
  const [startAngle, setStartAngle] = useState<string>("0");
  const [stopAngle, setStopAngle] = useState<string>("90");
  const [sectorJammingActive, setSectorJammingActive] = useState(false);
  const [sectorJammingStatus, setSectorJammingStatus] = useState<"idle" | "active" | "paused">("idle");
  const [currentSectorAngle, setCurrentSectorAngle] = useState<number>(parseFloat(startAngle));
  
  const sectorJammingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSectorJammingRunningRef = useRef<boolean>(false);
  const currentDirectionRef = useRef<"forward" | "backward">("forward");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sectorJammingIntervalRef.current) {
        clearInterval(sectorJammingIntervalRef.current);
      }
    };
  }, []);

  // Single toggle function for jammer
  const toggleJammer = async () => {
    if (jammerStatus === "starting" || jammerStatus === "stopping") return;

    const isStarting = jammerStatus !== "active";

    if (isStarting) {
      // Starting jammer
      setJammerStatus("starting");

      try {
        const token = getToken();

        // Get selected frequencies from checkboxes
        const activeFrequencies = Object.keys(selectedFrequencies).filter(
          (freq) => selectedFrequencies[freq]
        );

        if (activeFrequencies.length === 0) {
          if (onError) {
            onError("Please select at least one frequency band");
          }
          setJammerStatus("idle");
          return;
        }

        // Frequency priority order
        const frequencyPriority = [
          "5.8GHz",
          "5.2GHz",
          "2.4GHz",
          "4GHz",
          "1.5GHz",
          "<1GHz",
        ];

        // Find the highest priority selected frequency
        const primaryFrequency =
          frequencyPriority.find((freq) => activeFrequencies.includes(freq)) ||
          activeFrequencies[0];

        const requestBody = {
          frequencyBand: primaryFrequency,
          powerAttenuation: 18,
          allSelectedBands: activeFrequencies,
        };

        console.log("Starting jammer with frequencies:", {
          primary: primaryFrequency,
          all: activeFrequencies,
        });

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

        const data = await response.json();

        if (data.success) {
          setJammerStatus("active");
          if (onSuccess) {
            onSuccess(`Jamming started on ${primaryFrequency}${
              activeFrequencies.length > 1
                ? ` (${activeFrequencies.length} bands selected)`
                : ""
            }`);
          }
        } else {
          throw new Error(data.message || "Failed to start jamming");
        }
      } catch (error) {
        console.error("Error starting jammer:", error);
        setJammerStatus("idle");
        if (onError) {
          onError(
            error instanceof Error ? error.message : "Failed to start jamming"
          );
        }
      }
    } else {
      // Stopping jammer
      setJammerStatus("stopping");

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

        const data = await response.json();

        if (data.success) {
          setJammerStatus("idle");
          if (onSuccess) {
            onSuccess(data.message || "Jamming stopped successfully");
          }
        } else {
          throw new Error(data.message || "Failed to stop jamming");
        }
      } catch (error) {
        console.error("Error stopping jammer:", error);
        setJammerStatus("active");
        if (onError) {
          onError(
            error instanceof Error ? error.message : "Failed to stop jamming"
          );
        }
      }
    }
  };

  // Function to set antenna position
  const setAntennaPosition = async (azimuth: number, elevation?: number) => {
    try {
      const token = getToken();

      // Prepare the request body
      const requestBody = {
        command_type: "PTZ_CONTROL",
        ptz_azimuth: azimuth,
        ptz_elevation: elevation || parseFloat(elevationValue),
      };

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

      const data = await response.json();

      if (data.success) {
        // Update local state
        setAzimuthValue(azimuth.toString());
        if (elevation !== undefined) {
          setElevationValue(elevation.toString());
        }
        return true;
      } else {
        throw new Error(data.message || "Failed to set antenna position");
      }
    } catch (error) {
      console.error("Error setting antenna position:", error);
      if (onError) {
        onError(
          error instanceof Error ? error.message : "Failed to set antenna position"
        );
      }
      return false;
    }
  };

  // Function to start sector jamming
 // Function to start sector jamming
const startSectorJamming = async () => {
  if (!sectorJammingEnabled || sectorJammingActive) return;

  const start = parseFloat(startAngle);
  const stop = parseFloat(stopAngle);
  
  if (isNaN(start) || isNaN(stop)) {
    if (onError) onError("Please enter valid start and stop angles");
    return;
  }

  if (start === stop) {
    if (onError) onError("Start and stop angles must be different");
    return;
  }

  // Start jamming first if not already active
  if (jammerStatus !== "active") {
    // Call toggleJammer but don't wait for state update
    await toggleJammer();
    // Wait for a moment for the jammer to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  setSectorJammingActive(true);
  setSectorJammingStatus("active");
  setCurrentSectorAngle(start);
  isSectorJammingRunningRef.current = true;
  currentDirectionRef.current = "forward";

  // Set initial position
  const initialSuccess = await setAntennaPosition(start);
  if (!initialSuccess) {
    if (onError) onError("Failed to set initial position");
    stopSectorJamming();
    return;
  }

  // Start continuous movement
  sectorJammingIntervalRef.current = setInterval(async () => {
    if (!isSectorJammingRunningRef.current) return;

    let nextAngle = currentSectorAngle;
    const stepSize = 1; // Degrees per step

    // Calculate next angle based on direction
    if (currentDirectionRef.current === "forward") {
      nextAngle += stepSize;
      if (nextAngle >= stop) {
        nextAngle = stop;
        currentDirectionRef.current = "backward";
      }
    } else {
      nextAngle -= stepSize;
      if (nextAngle <= start) {
        nextAngle = start;
        currentDirectionRef.current = "forward";
      }
    }

    // Normalize angle to 0-360 range
    if (nextAngle < 0) nextAngle += 360;
    if (nextAngle >= 360) nextAngle -= 360;

    // Move antenna to next position
    const success = await setAntennaPosition(nextAngle);
    if (success) {
      setCurrentSectorAngle(nextAngle);
    } else {
      // Stop on error
      if (onError) onError("Failed to move antenna - stopping sector jamming");
      stopSectorJamming();
    }
  }, 1000); // Move every second
  
  if (onSuccess) {
    onSuccess(`Sector jamming started from ${start}° to ${stop}°`);
  }
};
  // Function to stop sector jamming
  const stopSectorJamming = () => {
    if (sectorJammingIntervalRef.current) {
      clearInterval(sectorJammingIntervalRef.current);
      sectorJammingIntervalRef.current = null;
    }
    
    isSectorJammingRunningRef.current = false;
    setSectorJammingActive(false);
    setSectorJammingStatus("idle");
    
    if (onSuccess) {
      onSuccess("Sector jamming stopped");
    }
  };

  // Function to pause/resume sector jamming
  const toggleSectorJammingPause = () => {
    if (!sectorJammingActive) return;
    
    isSectorJammingRunningRef.current = !isSectorJammingRunningRef.current;
    setSectorJammingStatus(isSectorJammingRunningRef.current ? "active" : "paused");
    
    if (onSuccess) {
      onSuccess(isSectorJammingRunningRef.current ? "Sector jamming resumed" : "Sector jamming paused");
    }
  };

  const handleFrequencyChange =
    (frequency: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedFrequencies((prev) => ({
        ...prev,
        [frequency]: event.target.checked,
      }));
    };

  // Get count of selected frequencies
  const selectedFrequencyCount =
    Object.values(selectedFrequencies).filter(Boolean).length;

  // Get status display text and color
  const getStatusDisplay = () => {
    switch (jammerStatus) {
      case "active":
        return { text: "🟢 JAMMER ACTIVE", color: "#ff4444" };
      case "starting":
        return { text: "🟡 STARTING...", color: "#ffaa00" };
      case "stopping":
        return { text: "🟡 STOPPING...", color: "#ffaa00" };
      default:
        return { text: "JAMMER IDLE 🔴", color: "#00ff41" };
    }
  };

  // Determine button text and state based on jammer status
  const getJammerButtonConfig = () => {
    switch (jammerStatus) {
      case "active":
        return {
          text: "STOP JAMMING",
          color: "#ff4444",
          backgroundColor: "#ff4444",
          hoverColor: "#cc3333",
          disabled: false,
        };
      case "starting":
        return {
          text: "STARTING...",
          color: "#ffaa00",
          backgroundColor: "#ffaa00",
          hoverColor: "#ffaa00",
          disabled: true,
        };
      case "stopping":
        return {
          text: "STOPPING...",
          color: "#ffaa00",
          backgroundColor: "#ffaa00",
          hoverColor: "#ffaa00",
          disabled: true,
        };
      default:
        return {
          text: "START JAMMING",
          color: "#00ff41",
          backgroundColor: "rgba(0, 255, 65, 0.3)",
          hoverColor: "#00ff41",
          disabled: selectedFrequencyCount === 0,
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const jammerButtonConfig = getJammerButtonConfig();

  return (
    <Box className="jammer-control-panel">
      {/* Jammer Status */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: statusDisplay.color,
            fontWeight: "bold",
            fontSize: "12px",
          }}
        >
          {statusDisplay.text}
        </Typography>
        {sectorJammingActive && (
          <Typography
            variant="caption"
            sx={{
              color: "#00ff41",
              fontWeight: "bold",
              fontSize: "10px",
              display: "block",
              mt: 0.5,
            }}
          >
            Sector: {currentSectorAngle.toFixed(1)}° ({sectorJammingStatus})
          </Typography>
        )}
      </Box>

      {/* Frequency Checkboxes */}
      <FrequencyCheckboxes
        frequencies={selectedFrequencies}
        onFrequencyChange={handleFrequencyChange}
        jammerStatus={jammerStatus}
      />

      {/* Toggle Button */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Button
          variant="contained"
          size="medium"
          onClick={toggleJammer}
          disabled={jammerButtonConfig.disabled}
          sx={{
            backgroundColor: jammerButtonConfig.backgroundColor,
            color: jammerStatus === "active" ? "#fff" : "#000",
            fontSize: "11px",
            padding: "6px 20px",
            fontFamily: "monospace",
            textTransform: "none",
            fontWeight: "bold",
            minWidth: "140px",
            "&:hover": {
              backgroundColor: jammerButtonConfig.hoverColor,
              boxShadow: `0 0 8px ${jammerButtonConfig.hoverColor}66`,
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(128, 128, 128, 0.3)",
              color: "rgba(255, 255, 255, 0.5)",
            },
          }}
        >
          {jammerButtonConfig.text}
        </Button>
      </Box>

      {/* PTZ Controls Toggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: "#00ff41",
            fontWeight: "bold",
            fontSize: "12px",
            mr: 1,
          }}
        >
          PTZ CONTROLS
        </Typography>

        <Button
          variant="text"
          size="small"
          onClick={() => setShowPtzControls(!showPtzControls)}
          sx={{
            minWidth: "30px",
            minHeight: "30px",
            padding: "4px",
            color: "#00ff41",
            fontSize: "14px",
            fontFamily: "monospace",
            "&:hover": {
              backgroundColor: "rgba(0, 255, 65, 0.1)",
            },
          }}
        >
          {showPtzControls ? "▼" : "▲"}
        </Button>
      </Box>

      {/* PTZ Controls */}
      {showPtzControls && (
        <PTZControls
          coneangle={coneangle}
          coneelevation={coneelevation}
          azimuthValue={azimuthValue}
          elevationValue={elevationValue}
          onAzimuthChange={(value) => setAzimuthValue(value.toString())}
          onElevationChange={(value) => setElevationValue(value.toString())}
          setAzimuth={(value) => setAntennaPosition(value)}
          setElevation={(value) => setAntennaPosition(parseFloat(azimuthValue), value)}
          // Sector jamming props
          sectorJammingEnabled={sectorJammingEnabled}
          setSectorJammingEnabled={setSectorJammingEnabled}
          startAngle={startAngle}
          setStartAngle={setStartAngle}
          stopAngle={stopAngle}
          setStopAngle={setStopAngle}
          sectorJammingActive={sectorJammingActive}
          sectorJammingStatus={sectorJammingStatus}
          onStartSectorJamming={startSectorJamming}
          onStopSectorJamming={stopSectorJamming}
          onToggleSectorJammingPause={toggleSectorJammingPause}
        />
      )}
    </Box>
  );
};

export default JammerControlPanel;