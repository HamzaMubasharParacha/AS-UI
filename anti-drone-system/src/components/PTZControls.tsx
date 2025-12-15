import React, { useState, useEffect } from "react";
import { Box, Typography, Slider } from "@mui/material";
import CircularSlider from "@fseehawer/react-circular-slider";

interface PTZControlsProps {
  coneangle: number; // Real current angle from API
  coneelevation: number;
  azimuthValue: string;
  elevationValue: string;
  onAzimuthChange: (value: number) => void;
  onElevationChange: (value: number) => void;
  setAzimuth: (value: number) => void;
  setElevation: (value: number) => void;
  // Sector jamming props
  sectorJammingEnabled: boolean;
  setSectorJammingEnabled: (enabled: boolean) => void;
  startAngle: string;
  setStartAngle: (angle: string) => void;
  stopAngle: string;
  setStopAngle: (angle: string) => void;
  sectorJammingActive: boolean;
  sectorJammingStatus: "idle" | "active" | "paused";
  onStartSectorJamming: () => void;
  onStopSectorJamming: () => void;
  onToggleSectorJammingPause: () => void;
  // Add current sector angle to display
  currentSectorAngle?: number;
  // New props for axis selection
  azimuthSectorEnabled: boolean;
  setAzimuthSectorEnabled: (enabled: boolean) => void;
  elevationSectorEnabled: boolean;
  setElevationSectorEnabled: (enabled: boolean) => void;
  // New props for elevation sector jamming
  elevationStartAngle: string;
  setElevationStartAngle: (angle: string) => void;
  elevationStopAngle: string;
  setElevationStopAngle: (angle: string) => void;
  currentElevationAngle?: number;
}

const PTZControls: React.FC<PTZControlsProps> = ({
  coneangle, // Real angle from API
  coneelevation,
  azimuthValue,
  elevationValue,
  onAzimuthChange,
  onElevationChange,
  setAzimuth,
  setElevation,
  // Sector jamming props
  sectorJammingEnabled,
  setSectorJammingEnabled,
  startAngle,
  setStartAngle,
  stopAngle,
  setStopAngle,
  sectorJammingActive,
  sectorJammingStatus,
  onStartSectorJamming,
  onStopSectorJamming,
  onToggleSectorJammingPause,
  currentSectorAngle,
  // New props for axis selection
  azimuthSectorEnabled,
  setAzimuthSectorEnabled,
  elevationSectorEnabled,
  setElevationSectorEnabled,
  // New props for elevation sector jamming
  elevationStartAngle,
  setElevationStartAngle,
  elevationStopAngle,
  setElevationStopAngle,
  currentElevationAngle,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(coneangle);
  
  // Sync the circular slider with the real coneangle whenever it changes
  useEffect(() => {
    setSliderValue(coneangle);
  }, [coneangle]);

  const handleAzimuthChange = (value: number) => {
    setSliderValue(value);
    onAzimuthChange(value);
    setAzimuth(value);
  };

  const handleElevationChange = (value: number) => {
    onElevationChange(value);
    setElevation(value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSectorJammingEnabled(e.target.checked);
  };

  const handleAzimuthCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAzimuthSectorEnabled(e.target.checked);
  };

  const handleElevationCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setElevationSectorEnabled(e.target.checked);
  };

  const handleStartAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[-]?\d*$/.test(value)) {
      setStartAngle(value);
    }
  };

  const handleStopAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[-]?\d*$/.test(value)) {
      setStopAngle(value);
    }
  };

  const handleElevationStartAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[-]?\d*$/.test(value)) {
      setElevationStartAngle(value);
    }
  };

  const handleElevationStopAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[-]?\d*$/.test(value)) {
      setElevationStopAngle(value);
    }
  };

  const handleStartSectorJamming = () => {
    onStartSectorJamming();
  };

  const getSectorJammingButtonConfig = () => {
    if (!sectorJammingActive) {
      return {
        text: "START SECTOR JAMMING",
        color: "#000",
        bgColor: "var(--primary-color)",
        hoverBgColor: "rgba(0, 255, 65, 0.8)",
        onClick: handleStartSectorJamming,
        disabled: !sectorJammingEnabled || (!azimuthSectorEnabled && !elevationSectorEnabled),
      };
    } else {
      if (sectorJammingStatus === "paused") {
        return {
          text: "RESUME JAMMING",
          color: "#000",
          bgColor: "#ffaa00",
          hoverBgColor: "rgba(255, 170, 0, 0.8)",
          onClick: onToggleSectorJammingPause,
          disabled: false,
        };
      } else {
        return {
          text: "STOP SECTOR JAMMING",
          color: "#fff",
          bgColor: "#ff4444",
          hoverBgColor: "rgba(255, 68, 68, 0.8)",
          onClick: onStopSectorJamming,
          disabled: false,
        };
      }
    }
  };

  const sectorJammingButtonConfig = getSectorJammingButtonConfig();

  // Display the current angle (use currentSectorAngle during sector jamming, otherwise use coneangle)
  const displayAzimuth = sectorJammingActive && currentSectorAngle !== undefined 
    ? currentSectorAngle 
    : coneangle;

  return (
    <Box className="ptz-controls">
      {/* Current Position Display */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 1.5,
          fontSize: "10px",
        }}
      >
        <Typography sx={{ color: "var(--primary-color)", fontSize: "10px" }}>
          Current: Az {displayAzimuth.toFixed(1)}° El {coneelevation.toFixed(1)}°
          {sectorJammingActive && " (Sector Scanning)"}
        </Typography>
      </Box>

      {/* Combined Azimuth and Elevation Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mb: 3,
        }}
      >
        {/* Circular Slider for Azimuth */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            width: "180px",
            height: "180px",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "150px",
              height: "150px",
            }}
          >
            <CircularSlider
              width={150}
              knobColor="var(--primary-color)"
              knobSize={25}
              progressColorFrom="rgba(12, 62, 22, 0.1)"
              progressColorTo="rgba(12, 62, 22, 0.1)"
              progressSize={6}
              trackColor="rgba(0, 255, 65, 0.2)"
              trackSize={6}
              min={0}
              max={360}
              label=""
              labelColor="var(--primary-color)"
              labelBottom={true}
              labelFontSize="0px"
              valueFontSize="0px"
              verticalOffset="10px"
              value={sliderValue}
              onChange={(value) => {
                const numValue = value as number;
                handleAzimuthChange(numValue);
              }}
            />

            {/* SVG Overlay for Markings */}
            <svg
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {[
                { angle: 0, value: "0°" },
                { angle: 45, value: "45°" },
                { angle: 90, value: "90°" },
                { angle: 135, value: "135°" },
                { angle: 180, value: "180°" },
                { angle: 225, value: "225°" },
                { angle: 270, value: "270°" },
                { angle: 315, value: "315°" },
              ].map(({ angle, value }) => {
                const rad = ((angle - 90) * Math.PI) / 180;
                const radius = 75;
                const center = 75;

                return (
                  <g key={angle}>
                    <line
                      x1={center + (radius - 12) * Math.cos(rad)}
                      y1={center + (radius - 12) * Math.sin(rad)}
                      x2={center + (radius + 5) * Math.cos(rad)}
                      y2={center + (radius + 5) * Math.sin(rad)}
                      stroke="var(--primary-color)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <text
                      x={center + (radius - 25) * Math.cos(rad)}
                      y={center + (radius - 25) * Math.sin(rad)}
                      fill="var(--primary-color)"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              {Array.from({ length: 72 }, (_, i) => i * 5).map((angle) => {
                if (angle % 45 === 0) return null;

                const rad = ((angle - 90) * Math.PI) / 180;
                const radius = 75;
                const center = 75;
                const markLength = angle % 15 === 0 ? 6 : 3;

                return (
                  <line
                    key={`minor-${angle}`}
                    x1={center + (radius - 8) * Math.cos(rad)}
                    y1={center + (radius - 8) * Math.sin(rad)}
                    x2={center + (radius - 8 + markLength) * Math.cos(rad)}
                    y2={center + (radius - 8 + markLength) * Math.sin(rad)}
                    stroke="var(--primary-color)"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          </Box>

          <Typography
            sx={{
              color: "var(--primary-color)",
              fontSize: "12px",
              fontFamily: "monospace",
              mt: 1,
              fontWeight: "bold",
            }}
          >
            Azimuth: {displayAzimuth.toFixed(1)}°
          </Typography>
        </Box>

        {/* Vertical Slider for Elevation */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            width: "120px",
            height: "180px",
          }}
        >
          <Box
            sx={{
              position: "relative",
              height: "150px",
              width: "100px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Slider
              orientation="vertical"
              min={-75}
              max={15}
              value={coneelevation || parseFloat(elevationValue) || 0}
              onChange={(event, value) => {
                const numValue = value as number;
                handleElevationChange(numValue);
              }}
              marks={[
                { value: -75, label: "-75°" },
                { value: -60, label: "-60°" },
                { value: -45, label: "-45°" },
                { value: -30, label: "-30°" },
                { value: -15, label: "-15°" },
                { value: 0, label: "0°" },
                { value: 15, label: "15" },
              ]}
              valueLabelDisplay="auto"
              sx={{
                color: "var(--primary-color)",
                height: "140px",
                "& .MuiSlider-track": {
                  background: "linear-gradient(to top, #11461d, #11461d)",
                  border: "none",
                  width: "4px",
                  left: "calc(50% - 2px)",
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "rgba(0, 255, 65, 0.2)",
                  width: "4px",
                  left: "calc(50% - 2px)",
                },
                "& .MuiSlider-thumb": {
                  backgroundColor: "var(--primary-color)",
                  width: 20,
                  height: 20,
                  border: "2px solid #000",
                  boxShadow: "0 0 10px rgba(0, 255, 65, 0.8)",
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 15px rgba(0, 255, 65, 1)",
                  },
                  "&.Mui-active": {
                    boxShadow: "0 0 20px rgba(0, 255, 65, 1)",
                  },
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "var(--primary-color)",
                  width: "8px",
                  height: "2px",
                  borderRadius: "0",
                  left: "calc(50% - 4px)",
                },
                "& .MuiSlider-markLabel": {
                  color: "var(--primary-color)",
                  fontSize: "9px",
                  fontFamily: "monospace",
                  left: "30px",
                  right: "auto",
                },
                "& .MuiSlider-valueLabel": {
                  backgroundColor: "var(--primary-color)",
                  color: "#000",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  "&::before": {
                    display: "none",
                  },
                },
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                height: "100%",
                width: "1px",
                backgroundColor: "rgba(0, 255, 65, 0.3)",
                zIndex: -1,
              }}
            />
          </Box>

          <Typography
            sx={{
              color: "var(--primary-color)",
              fontSize: "12px",
              fontFamily: "monospace",
              mt: 1,
              fontWeight: "bold",
            }}
          >
            Elevation: {coneelevation.toFixed(1)}°
          </Typography>
        </Box>
      </Box>

      {/* Sector Jamming Section */}
      <Box
       
      >
        {/* Main Checkbox and Label */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
          <input 
            type="checkbox" 
            id="sector-jamming"
            checked={sectorJammingEnabled}
            onChange={handleCheckboxChange}
            style={{
              appearance: "none",
              width: "16px",
              height: "16px",
              border: "2px solid var(--primary-color)",
              borderRadius: "3px",
              backgroundColor: sectorJammingEnabled ? "var(--primary-color)" : "rgba(0, 255, 65, 0.1)",
              cursor: "pointer",
              marginRight: "8px",
              position: "relative",
              boxShadow: sectorJammingEnabled ? "0 0 10px rgba(0, 255, 65, 0.8)" : "none",
            }}
          />
          <label 
            htmlFor="sector-jamming"
            style={{
              color: "var(--primary-color)",
              fontSize: "12px",
              fontFamily: "monospace",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Sector Jamming
          </label>
        </Box>

        {/* Show these controls only when checkbox is checked */}
        {sectorJammingEnabled && (
          <>
            {/* Azimuth and Elevation Checkboxes */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mb: 2 }}>
              {/* Azimuth Checkbox */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <input 
                  type="checkbox" 
                  id="azimuth-sector"
                  checked={azimuthSectorEnabled}
                  onChange={handleAzimuthCheckboxChange}
                  disabled={sectorJammingActive}
                  style={{
                    appearance: "none",
                    width: "14px",
                    height: "14px",
                    border: "2px solid var(--primary-color)",
                    borderRadius: "3px",
                    backgroundColor: azimuthSectorEnabled ? "var(--primary-color)" : "rgba(0, 255, 65, 0.1)",
                    cursor: sectorJammingActive ? "not-allowed" : "pointer",
                    marginRight: "6px",
                    opacity: sectorJammingActive ? 0.7 : 1,
                    boxShadow: azimuthSectorEnabled ? "0 0 8px rgba(0, 255, 65, 0.8)" : "none",
                  }}
                />
                <label 
                  htmlFor="azimuth-sector"
                  style={{
                    color: azimuthSectorEnabled ? "var(--primary-color)" : "rgba(0, 255, 65, 0.7)",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: sectorJammingActive ? "not-allowed" : "pointer",
                  }}
                >
                  Azimuth
                </label>
              </Box>

              {/* Elevation Checkbox */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <input 
                  type="checkbox" 
                  id="elevation-sector"
                  checked={elevationSectorEnabled}
                  onChange={handleElevationCheckboxChange}
                  disabled={sectorJammingActive}
                  style={{
                    appearance: "none",
                    width: "14px",
                    height: "14px",
                    border: "2px solid var(--primary-color)",
                    borderRadius: "3px",
                    backgroundColor: elevationSectorEnabled ? "var(--primary-color)" : "rgba(0, 255, 65, 0.1)",
                    cursor: sectorJammingActive ? "not-allowed" : "pointer",
                    marginRight: "6px",
                    opacity: sectorJammingActive ? 0.7 : 1,
                    boxShadow: elevationSectorEnabled ? "0 0 8px rgba(0, 255, 65, 0.8)" : "none",
                  }}
                />
                <label 
                  htmlFor="elevation-sector"
                  style={{
                    color: elevationSectorEnabled ? "var(--primary-color)" : "rgba(0, 255, 65, 0.7)",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: sectorJammingActive ? "not-allowed" : "pointer",
                  }}
                >
                  Elevation
                </label>
              </Box>
            </Box>

            {/* Angle Inputs */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 3,
                mb: 2,
              }}
            >
              {/* Azimuth Angle Inputs (only show if azimuth checkbox is checked) */}
              {azimuthSectorEnabled && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Typography
                    sx={{
                      color: "var(--primary-color)",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      mb: 1,
                      fontWeight: "bold",
                    }}
                  >
                    Azimuth Angles
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <label 
                        style={{
                          color: "var(--primary-color)",
                          fontSize: "10px",
                          fontFamily: "monospace",
                          marginBottom: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        Start
                      </label>
                      <input 
                        type="text" 
                        value={startAngle}
                        onChange={handleStartAngleChange}
                        disabled={sectorJammingActive}
                        style={{
                          width: "60px",
                          padding: "4px 6px",
                          backgroundColor: sectorJammingActive 
                            ? "rgba(0, 255, 65, 0.05)" 
                            : "rgba(0, 255, 65, 0.05)",
                          border: "1px solid rgba(0, 255, 65, 0.3)",
                          borderRadius: "3px",
                          color: "var(--primary-color)",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          textAlign: "center",
                          outline: "none",
                          opacity: sectorJammingActive ? 0.7 : 1,
                        }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <label 
                        style={{
                          color: "var(--primary-color)",
                          fontSize: "10px",
                          fontFamily: "monospace",
                          marginBottom: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        Stop
                      </label>
                      <input 
                        type="text" 
                        value={stopAngle}
                        onChange={handleStopAngleChange}
                        disabled={sectorJammingActive}
                        style={{
                          width: "60px",
                          padding: "4px 6px",
                          backgroundColor: sectorJammingActive 
                            ? "rgba(0, 255, 65, 0.05)" 
                            : "rgba(0, 255, 65, 0.05)",
                          border: "1px solid rgba(0, 255, 65, 0.3)",
                          borderRadius: "3px",
                          color: "var(--primary-color)",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          textAlign: "center",
                          outline: "none",
                          opacity: sectorJammingActive ? 0.7 : 1,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Elevation Angle Inputs (only show if elevation checkbox is checked) */}
              {elevationSectorEnabled && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Typography
                    sx={{
                      color: "var(--primary-color)",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      mb: 1,
                      fontWeight: "bold",
                    }}
                  >
                    Elevation Angles
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <label 
                        style={{
                          color: "var(--primary-color)",
                          fontSize: "10px",
                          fontFamily: "monospace",
                          marginBottom: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        Start
                      </label>
                      <input 
                        type="text" 
                        value={elevationStartAngle}
                        onChange={handleElevationStartAngleChange}
                        disabled={sectorJammingActive}
                        style={{
                          width: "60px",
                          padding: "4px 6px",
                          backgroundColor: sectorJammingActive 
                            ? "rgba(0, 255, 65, 0.05)" 
                            : "rgba(0, 255, 65, 0.05)",
                          border: "1px solid rgba(0, 255, 65, 0.3)",
                          borderRadius: "3px",
                          color: "var(--primary-color)",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          textAlign: "center",
                          outline: "none",
                          opacity: sectorJammingActive ? 0.7 : 1,
                        }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <label 
                        style={{
                          color: "var(--primary-color)",
                          fontSize: "10px",
                          fontFamily: "monospace",
                          marginBottom: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        Stop
                      </label>
                      <input 
                        type="text" 
                        value={elevationStopAngle}
                        onChange={handleElevationStopAngleChange}
                        disabled={sectorJammingActive}
                        style={{
                          width: "60px",
                          padding: "4px 6px",
                          backgroundColor: sectorJammingActive 
                            ? "rgba(0, 255, 65, 0.05)" 
                            : "rgba(0, 255, 65, 0.05)",
                          border: "1px solid rgba(0, 255, 65, 0.3)",
                          borderRadius: "3px",
                          color: "var(--primary-color)",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          textAlign: "center",
                          outline: "none",
                          opacity: sectorJammingActive ? 0.7 : 1,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Status Message when no axis selected */}
            {!azimuthSectorEnabled && !elevationSectorEnabled && (
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography
                  sx={{
                    color: "#ffaa00",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    fontStyle: "italic",
                  }}
                >
                  Select at least one axis (Azimuth or Elevation) to start sector jamming
                </Typography>
              </Box>
            )}

            {/* Control Buttons */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 1 }}>
              {sectorJammingActive && (
                <button
                  onClick={onToggleSectorJammingPause}
                  style={{
                    backgroundColor: sectorJammingStatus === "paused" ? "var(--primary-color)" : "#ffaa00",
                    color: sectorJammingStatus === "paused" ? "#000" : "#000",
                    border: "1px solid rgba(0, 255, 65, 0.5)",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: `0 0 10px ${
                      sectorJammingStatus === "paused" 
                        ? "rgba(0, 255, 65, 0.5)" 
                        : "rgba(255, 170, 0, 0.5)"
                    }`,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {sectorJammingStatus === "paused" ? "RESUME" : "PAUSE"}
                </button>
              )}

              {/* Main Sector Jamming Button */}
              <button
                onClick={sectorJammingButtonConfig.onClick}
                disabled={sectorJammingButtonConfig.disabled}
                style={{
                  backgroundColor: sectorJammingButtonConfig.bgColor,
                  color: sectorJammingButtonConfig.color,
                  border: "1px solid rgba(0, 255, 65, 0.5)",
                  borderRadius: "4px",
                  padding: "8px 24px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  cursor: sectorJammingButtonConfig.disabled ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: `0 0 15px ${sectorJammingButtonConfig.bgColor}80`,
                  opacity: sectorJammingButtonConfig.disabled ? 0.5 : 1,
                }}
                onMouseOver={(e) => {
                  if (!sectorJammingButtonConfig.disabled) {
                    e.currentTarget.style.backgroundColor = sectorJammingButtonConfig.hoverBgColor;
                    e.currentTarget.style.boxShadow = `0 0 20px ${sectorJammingButtonConfig.bgColor}`;
                  }
                }}
                onMouseOut={(e) => {
                  if (!sectorJammingButtonConfig.disabled) {
                    e.currentTarget.style.backgroundColor = sectorJammingButtonConfig.bgColor;
                    e.currentTarget.style.boxShadow = `0 0 15px ${sectorJammingButtonConfig.bgColor}80`;
                  }
                }}
              >
                {sectorJammingButtonConfig.text}
              </button>
            </Box>

            {/* Status Indicator */}
            {sectorJammingActive && (
              <Box sx={{ textAlign: "center", mt: 1 }}>
                <Typography
                  sx={{
                    color: sectorJammingStatus === "active" ? "var(--primary-color)" : "#ffaa00",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                  }}
                >
                  {sectorJammingStatus === "active" 
                    ? `▶️ SCANNING: ${currentSectorAngle?.toFixed(1) || coneangle.toFixed(1)}°${elevationSectorEnabled ? ` / ${currentElevationAngle?.toFixed(1) || coneelevation.toFixed(1)}°` : ''}` 
                    : "⏸️ PAUSED"}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default PTZControls;