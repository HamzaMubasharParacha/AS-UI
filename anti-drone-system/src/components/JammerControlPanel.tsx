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
  onJammerActiveChange?: (isActive: boolean) => void; // ADDED: Callback to parent
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
          color: "var(--primary-color)",
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
                color: "var(--primary-color)",
                "&.Mui-checked": {
                  color: "var(--primary-color)",
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
  onJammerActiveChange, // ADDED: Receive callback from parent
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
  
  // New state for elevation sector jamming
  const [elevationStartAngle, setElevationStartAngle] = useState<string>("0");
  const [elevationStopAngle, setElevationStopAngle] = useState<string>("45");
  const [currentElevationAngle, setCurrentElevationAngle] = useState<number>(parseFloat(elevationStartAngle));
  
  // New state for axis selection
  const [azimuthSectorEnabled, setAzimuthSectorEnabled] = useState(true);
  const [elevationSectorEnabled, setElevationSectorEnabled] = useState(false);
  
  // Refs for azimuth sector jamming
  const sectorJammingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSectorJammingRunningRef = useRef<boolean>(false);
  const currentAzimuthDirectionRef = useRef<"forward" | "backward">("forward");
  const currentAzimuthAngleRef = useRef<number>(parseFloat(startAngle));
  const azimuthStartAngleRef = useRef<number>(parseFloat(startAngle));
  const azimuthStopAngleRef = useRef<number>(parseFloat(stopAngle));
  
  // New refs for elevation sector jamming
  const currentElevationAngleRef = useRef<number>(parseFloat(elevationStartAngle));
  const elevationStartAngleRef = useRef<number>(parseFloat(elevationStartAngle));
  const elevationStopAngleRef = useRef<number>(parseFloat(elevationStopAngle));
  const currentElevationDirectionRef = useRef<"up" | "down">("up");

  // Step sizes
  const azimuthStepSize = 10;
  const elevationStepSize = 3;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sectorJammingIntervalRef.current) {
        clearInterval(sectorJammingIntervalRef.current);
      }
    };
  }, []);

  // Helper function to notify parent about jammer active status
  const notifyParentJammerActive = (isActive: boolean) => {
    if (onJammerActiveChange) {
      onJammerActiveChange(isActive);
      console.log(`Notified parent: Jammer is ${isActive ? 'ACTIVE' : 'IDLE'}`);
    }
  };

  // Single toggle function for jammer - UPDATED to notify parent
  const toggleJammer = async () => {
    if (jammerStatus === "starting" || jammerStatus === "stopping") return;

    const isStarting = jammerStatus !== "active";

    if (isStarting) {
      // Starting jammer
      setJammerStatus("starting");
      notifyParentJammerActive(false); // Not active yet during starting

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
          notifyParentJammerActive(false);
          return;
        }

        // Format frequency bands with commas: "5.8GHz , 5.2GHz , 2.4GHz"
        const frequencyBandString = activeFrequencies
          .map(freq => freq.trim())
          .join(' , ');

        console.log("Formatted frequency bands:", frequencyBandString);

        // Create request body with the exact format you want
        const requestBody = {
          frequencyBand: frequencyBandString,
          powerAttenuation: 18
        };

        console.log("Request body:", JSON.stringify(requestBody, null, 2));
        console.log("Starting jammer with frequencies:", frequencyBandString);

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
          notifyParentJammerActive(true); // NOW ACTIVE!
          
          if (onSuccess) {
            onSuccess(`Jamming started on ${frequencyBandString}`);
          }
        } else {
          throw new Error(data.message || "Failed to start jamming");
        }
      } catch (error) {
        console.error("Error starting jammer:", error);
        setJammerStatus("idle");
        notifyParentJammerActive(false);
        
        if (onError) {
          onError(
            error instanceof Error ? error.message : "Failed to start jamming"
          );
        }
      }
    } else {
      // Stopping jammer
      setJammerStatus("stopping");
      notifyParentJammerActive(true); // Still active during stopping

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
          notifyParentJammerActive(false); // NOW IDLE!
          
          if (onSuccess) {
            onSuccess(data.message || "Jamming stopped successfully");
          }
        } else {
          throw new Error(data.message || "Failed to stop jamming");
        }
      } catch (error) {
        console.error("Error stopping jammer:", error);
        setJammerStatus("active");
        notifyParentJammerActive(true); // Still active due to error
        
        if (onError) {
          onError(
            error instanceof Error ? error.message : "Failed to stop jamming"
          );
        }
      }
    }
  };

  // Function to set antenna position
  const setAntennaPosition = async (azimuth?: number, elevation?: number) => {
    try {
      const token = getToken();

      // Prepare the request body
      const requestBody = {
        command_type: "PTZ_CONTROL",
        ptz_azimuth: azimuth !== undefined ? azimuth : parseFloat(azimuthValue),
        ptz_elevation: elevation !== undefined ? elevation : parseFloat(elevationValue),
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
        if (azimuth !== undefined) {
          setAzimuthValue(azimuth.toString());
        }
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
  const startSectorJamming = async () => {
    if (!sectorJammingEnabled || sectorJammingActive) return;

    // Validate at least one axis is selected
    if (!azimuthSectorEnabled && !elevationSectorEnabled) {
      if (onError) onError("Please select at least one axis (Azimuth or Elevation)");
      return;
    }

    // Validate azimuth angles if enabled
    if (azimuthSectorEnabled) {
      const azimuthStart = parseFloat(startAngle);
      const azimuthStop = parseFloat(stopAngle);
      
      if (isNaN(azimuthStart) || isNaN(azimuthStop)) {
        if (onError) onError("Please enter valid azimuth start and stop angles");
        return;
      }

      if (azimuthStart === azimuthStop) {
        if (onError) onError("Azimuth start and stop angles must be different");
        return;
      }

      // Update azimuth refs with current values
      const actualAzimuthStart = Math.min(azimuthStart, azimuthStop);
      const actualAzimuthStop = Math.max(azimuthStart, azimuthStop);
      
      azimuthStartAngleRef.current = actualAzimuthStart;
      azimuthStopAngleRef.current = actualAzimuthStop;
      currentAzimuthAngleRef.current = actualAzimuthStart;
    }

    // Validate elevation angles if enabled
    if (elevationSectorEnabled) {
      const elevationStart = parseFloat(elevationStartAngle);
      const elevationStop = parseFloat(elevationStopAngle);
      
      if (isNaN(elevationStart) || isNaN(elevationStop)) {
        if (onError) onError("Please enter valid elevation start and stop angles");
        return;
      }

      if (elevationStart === elevationStop) {
        if (onError) onError("Elevation start and stop angles must be different");
        return;
      }

      // Update elevation refs with current values
      const actualElevationStart = Math.min(elevationStart, elevationStop);
      const actualElevationStop = Math.max(elevationStart, elevationStop);
      
      elevationStartAngleRef.current = actualElevationStart;
      elevationStopAngleRef.current = actualElevationStop;
      currentElevationAngleRef.current = actualElevationStart;
    }

    // Start jamming first if not already active
    if (jammerStatus !== "active") {
      await toggleJammer();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSectorJammingActive(true);
    setSectorJammingStatus("active");
    
    if (azimuthSectorEnabled) {
      setCurrentSectorAngle(azimuthStartAngleRef.current);
    }
    if (elevationSectorEnabled) {
      setCurrentElevationAngle(elevationStartAngleRef.current);
    }
    
    isSectorJammingRunningRef.current = true;
    currentAzimuthDirectionRef.current = "forward";
    currentElevationDirectionRef.current = "up";

    // Set initial position
    const initialAzimuth = azimuthSectorEnabled ? azimuthStartAngleRef.current : undefined;
    const initialElevation = elevationSectorEnabled ? elevationStartAngleRef.current : undefined;
    
    const initialSuccess = await setAntennaPosition(initialAzimuth, initialElevation);
    if (!initialSuccess) {
      if (onError) onError("Failed to set initial position");
      stopSectorJamming();
      return;
    }

    // Clear any existing interval
    if (sectorJammingIntervalRef.current) {
      clearInterval(sectorJammingIntervalRef.current);
    }

    // Start continuous movement with different step sizes for azimuth and elevation
    sectorJammingIntervalRef.current = setInterval(async () => {
      if (!isSectorJammingRunningRef.current) return;

      let nextAzimuth = currentAzimuthAngleRef.current;
      let nextElevation = currentElevationAngleRef.current;
      let moveAzimuth = false;
      let moveElevation = false;

      // Calculate next azimuth angle based on direction (if enabled)
      if (azimuthSectorEnabled) {
        moveAzimuth = true;
        if (currentAzimuthDirectionRef.current === "forward") {
          nextAzimuth += azimuthStepSize;
          if (nextAzimuth > azimuthStopAngleRef.current) {
            nextAzimuth = azimuthStopAngleRef.current;
            currentAzimuthDirectionRef.current = "backward";
          }
        } else {
          nextAzimuth -= azimuthStepSize;
          if (nextAzimuth < azimuthStartAngleRef.current) {
            nextAzimuth = azimuthStartAngleRef.current;
            currentAzimuthDirectionRef.current = "forward";
          }
        }
      }

      // Calculate next elevation angle based on direction (if enabled)
      if (elevationSectorEnabled) {
        moveElevation = true;
        if (currentElevationDirectionRef.current === "up") {
          nextElevation += elevationStepSize;
          if (nextElevation > elevationStopAngleRef.current) {
            nextElevation = elevationStopAngleRef.current;
            currentElevationDirectionRef.current = "down";
          }
        } else {
          nextElevation -= elevationStepSize;
          if (nextElevation < elevationStartAngleRef.current) {
            nextElevation = elevationStartAngleRef.current;
            currentElevationDirectionRef.current = "up";
          }
        }
      }

      // Move antenna to next position
      const success = await setAntennaPosition(
        moveAzimuth ? nextAzimuth : undefined,
        moveElevation ? nextElevation : undefined
      );
      
      if (success) {
        if (moveAzimuth) {
          currentAzimuthAngleRef.current = nextAzimuth;
          setCurrentSectorAngle(nextAzimuth);
        }
        if (moveElevation) {
          currentElevationAngleRef.current = nextElevation;
          setCurrentElevationAngle(nextElevation);
        }
      } else {
        // Stop on error
        if (onError) onError("Failed to move antenna - stopping sector jamming");
        stopSectorJamming();
      }
    }, 1000); // Move every second
    
    if (onSuccess) {
      let message = "Sector jamming started";
      if (azimuthSectorEnabled) {
        message += ` (Azimuth: ${azimuthStartAngleRef.current}° to ${azimuthStopAngleRef.current}° with ${azimuthStepSize}° steps)`;
      }
      if (elevationSectorEnabled) {
        message += ` (Elevation: ${elevationStartAngleRef.current}° to ${elevationStopAngleRef.current}° with ${elevationStepSize}° steps)`;
      }
      onSuccess(message);
    }
  };

  // Function to stop sector jamming
  const stopSectorJamming = () => {
    isSectorJammingRunningRef.current = false;
    
    if (sectorJammingIntervalRef.current) {
      clearInterval(sectorJammingIntervalRef.current);
      sectorJammingIntervalRef.current = null;
    }
    
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
          color: "var(--primary-color)",
          backgroundColor: "rgba(0, 255, 65, 0.3)",
          hoverColor: "var(--primary-color)",
          disabled: selectedFrequencyCount === 0,
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const jammerButtonConfig = getJammerButtonConfig();

  return (
    <Box className="jammer-control-panel">
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
            color: "var(--primary-color)",
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
            color: "var(--primary-color)",
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
          setElevation={(value) => setAntennaPosition(undefined, value)}
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
          currentSectorAngle={currentSectorAngle}
          // New props for elevation sector jamming
          azimuthSectorEnabled={azimuthSectorEnabled}
          setAzimuthSectorEnabled={setAzimuthSectorEnabled}
          elevationSectorEnabled={elevationSectorEnabled}
          setElevationSectorEnabled={setElevationSectorEnabled}
          elevationStartAngle={elevationStartAngle}
          setElevationStartAngle={setElevationStartAngle}
          elevationStopAngle={elevationStopAngle}
          setElevationStopAngle={setElevationStopAngle}
          currentElevationAngle={currentElevationAngle}
        />
      )}
    </Box>
  );
};

export default JammerControlPanel;