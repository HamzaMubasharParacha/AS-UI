import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { PlayArrow, Pause } from "@mui/icons-material";
import SpectrumWaterfall from "./SpectrumWaterfall";
import { hardwareSystemId, simulate, spectrum_data, subscribe } from "../api/config";
 
const SpectrumAnalyzer: React.FC = () => {
  // const FFT_SIZE = 2048;
  // const [fft, setFft] = useState(new Array(FFT_SIZE).fill(-80));
  const [fft, setFft] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
 
  useEffect(() => {
    let timer: NodeJS.Timeout;
 
    const subscribe_user = async () => {
      try {
        const token = sessionStorage.getItem("token");
        // const res = await fetch(spectrum_data);
        const res = await fetch(`${subscribe}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
      } catch (err) {
        console.error("Subscribe API Error:", err);
      }
    };
 
    const simulate_data = async () => {
      try {
        const token = sessionStorage.getItem("token");
        // const res = await fetch(spectrum_data);
        const res = await fetch(`${simulate}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
      } catch (err) {
        console.error("Subscribe API Error:", err);
      }
    };
 
    const fetchSpectrum = async () => {
      try {
        const token = sessionStorage.getItem("token");
        // const res = await fetch(spectrum_data);
        const res = await fetch(`${spectrum_data}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
 
        if (!json?.data || !json.data[hardwareSystemId]) return;
 
        const powerSpectrum =
          json.data[hardwareSystemId].decodedValues?.powerSpectrum;
 
        if (!powerSpectrum) return;
 
        // Clean invalid values
        const cleaned = powerSpectrum.map((v: number) =>
          isFinite(v) ? v : -100
        );
 
        setFft(cleaned);
      } catch (err) {
        console.error("Spectrum API Error:", err);
      }
    };
 
    if (isPlaying) {
      // timer = setInterval(() => {
      //   const arr = new Array(FFT_SIZE).fill(0).map((_, i) => {
      //     const noise = -90 + Math.random() * 8;
 
      //     // Create multiple tones across the spectrum
      //     const tone1 = -25 * Math.exp(-Math.pow((i - 200) / 30, 2));
      //     const tone2 = -35 * Math.exp(-Math.pow((i - 800) / 50, 2));
      //     const tone3 = -30 * Math.exp(-Math.pow((i - 1400) / 40, 2));
 
      //     return noise + tone1 + tone2 + tone3;
      //   });
 
      //   setFft(arr);
      // }, 50);
 
      subscribe_user();
      simulate_data();
      timer = setInterval(fetchSpectrum, 50); // 20Hz
    }
 
    // return () => {
    //   if (timer) clearInterval(timer);
    // };
 
    return () => clearInterval(timer);
 
    // }, [isPlaying, FFT_SIZE]);
  }, [isPlaying]);
 
  return (
    <Box
      sx={{
        p: 2,
        color: "#00ff41",
        fontFamily: '"Roboto Mono", monospace',
        height: "100%",
        backgroundColor: "#0a0a0a",
        width: "100%",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          borderBottom: "1px solid #00ff41",
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ color: "#00ff41", fontWeight: "bold" }}>
          📡 ADVANCED SPECTRUM ANALYZER
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsPlaying(!isPlaying)}
          sx={{
            color: "#00ff41",
            border: "1px solid #00ff41",
            "&:hover": { backgroundColor: "rgba(0, 255, 65, 0.1)" },
          }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Box>
 
      {/* Spectrum Waterfall Component */}
      <Box
        sx={{
          border: "2px solid #00ff41",
          borderRadius: 1,
          overflow: "auto",
          maxWidth: "100%",
        }}
      >
       // In SpectrumAnalyzer.tsx, update the SpectrumWaterfall component:
<SpectrumWaterfall
  spectrumData={fft}
  width={870}
  height={500}
  minDb={-120}
  maxDb={0}
  onSpectrumDraggedOut={() => {
    // Optional: you can add any logic here when spectrum is dragged out
    console.log('Spectrum analyzer dragged out');
  }}
/>
      </Box>
 
    </Box>
  );
};
 
export default SpectrumAnalyzer;
 
 