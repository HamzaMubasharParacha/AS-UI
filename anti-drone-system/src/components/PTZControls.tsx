import React from "react";
import { Box, Typography, Slider } from "@mui/material";
import CircularSlider from "@fseehawer/react-circular-slider";

interface PTZControlsProps {
  coneangle: number;
  coneelevation: number;
  azimuthValue: string;
  elevationValue: string;
  onAzimuthChange: (value: number) => void;
  onElevationChange: (value: number) => void;
  setAzimuth: (value: number) => void;
  setElevation: (value: number) => void;
}

const PTZControls: React.FC<PTZControlsProps> = ({
  coneangle,
  coneelevation,
  azimuthValue,
  elevationValue,
  onAzimuthChange,
  onElevationChange,
  setAzimuth,
  setElevation,
}) => {
  
  const handleAzimuthChange = (value: number) => {
    onAzimuthChange(value);
    setAzimuth(value);
  };

  const handleElevationChange = (value: number) => {
    onElevationChange(value);
    setElevation(value);
  };

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
        <Typography sx={{ color: "#00ff41", fontSize: "10px" }}>
          Current: Az {coneangle}° El {coneelevation}°
        </Typography>
      </Box>

      {/* Combined Azimuth and Elevation Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mb: 2,
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
              knobColor="#00ff41"
              knobSize={25}
              progressColorFrom="rgba(12, 62, 22, 0.1)"
              progressColorTo="rgba(12, 62, 22, 0.1)"
              progressSize={6}
              trackColor="rgba(0, 255, 65, 0.2)"
              trackSize={6}
              min={0}
              max={360}
              label=""
              labelColor="#00ff41"
              labelBottom={true}
              labelFontSize="0px"
              valueFontSize="0px"
              verticalOffset="10px"
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
                      stroke="#00ff41"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <text
                      x={center + (radius - 25) * Math.cos(rad)}
                      y={center + (radius - 25) * Math.sin(rad)}
                      fill="#00ff41"
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
                    stroke="#00ff41"
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
              color: "#00ff41",
              fontSize: "12px",
              fontFamily: "monospace",
              mt: 1,
              fontWeight: "bold",
            }}
          >
            Azimuth: {azimuthValue}°
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
              min={-80}
              max={15}
              value={parseFloat(elevationValue) || 0}
              onChange={(event, value) => {
                const numValue = value as number;
                handleElevationChange(numValue);
              }}
              marks={[
                { value: -80, label: "-80°" },
                { value: -60, label: "-60°" },
                { value: -45, label: "-45°" },
                { value: -30, label: "-30°" },
                { value: -15, label: "-15°" },
                { value: 0, label: "0°" },
                { value: 10, label: "10°" },
                { value: 15, label: "15" },
              ]}
              valueLabelDisplay="auto"
              sx={{
                color: "#00ff41",
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
                  backgroundColor: "#00ff41",
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
                  backgroundColor: "#00ff41",
                  width: "8px",
                  height: "2px",
                  borderRadius: "0",
                  left: "calc(50% - 4px)",
                },
                "& .MuiSlider-markLabel": {
                  color: "#00ff41",
                  fontSize: "9px",
                  fontFamily: "monospace",
                  left: "30px",
                  right: "auto",
                },
                "& .MuiSlider-valueLabel": {
                  backgroundColor: "#00ff41",
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
              color: "#00ff41",
              fontSize: "12px",
              fontFamily: "monospace",
              mt: 1,
              fontWeight: "bold",
            }}
          >
            Elevation: {elevationValue}°
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PTZControls;