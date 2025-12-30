import { Box, Typography } from "@mui/material";

// Compass Component (same as before)
const Compass: React.FC<{
  bearing: number;
  size?: number;
  isDarkMode?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}> = ({ bearing, size = 80, position = "bottom-left", isDarkMode }) => {
  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return { top: 10, left: 10 };
      case "top-right":
        return { top: 10, right: 10 };
      case "bottom-left":
        return { bottom: 20, left: 10 };
      case "bottom-right":
        return { bottom: 10, right: 10 };
      default:
        return { top: 10, right: 10 };
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        ...getPositionStyles(),
        width: size,
        height: size,
        backgroundColor: !isDarkMode ? "white" : "rgba(0, 0, 0, 0.85)",
        borderRadius: "50%",
        border: `2px solid ${isDarkMode ? "var(--primary-color)" : "white"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Compass Outer Circle */}
      <Box
        sx={{
          position: "relative",
          width: size - 20,
          height: size - 20,
          borderRadius: "50%",
          border: `1px solid ${isDarkMode ? "var(--primary-color)" : "black"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Direction Letters */}
        <Typography
          sx={{
            position: "absolute",
            top: 2,
            left: "50%",
            transform: "translateX(-50%)",
            color: "var(--primary-color)",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          N
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            color: "var(--primary-color)",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          S
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            left: 2,
            top: "50%",
            transform: "translateY(-50%)",
            color: isDarkMode ?  "var(--primary-color)" : 'black',
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          W
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            right: 2,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--primary-color)",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          E
        </Typography>

        {/* Compass Needle */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            transform: `rotate(${bearing}deg)`,
            transition: "transform 0.3s ease",
          }}
        >
          {/* North Pointer */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 2,
              height: "40%",
              backgroundColor: "#ff0000",
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "8px solid #ff0000",
              },
            }}
          />

          {/* South Pointer */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 2,
              height: "40%",
              backgroundColor: "var(--primary-color)",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "8px solid var(--primary-color)",
              },
            }}
          />

          {/* Center Dot */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 8,
              height: 8,
              backgroundColor: "var(--primary-color)",
              borderRadius: "50%",
              border: "1px solid #fff",
            }}
          />
        </Box>

        {/* Direction Display */}
        <Box
          sx={{
            position: "absolute",
            bottom: -25,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: isDarkMode? "rgba(0, 0, 0, 0.9)" : "white",
            color: "var(--primary-color)",
            padding: "2px 8px",
            borderRadius: 2,
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: "bold",
            border: "1px solid var(--primary-color)",
            whiteSpace: "nowrap",
          }}
        >
          {Math.round(bearing)}°
        </Box>
      </Box>
    </Box>
  );
};

export default Compass;