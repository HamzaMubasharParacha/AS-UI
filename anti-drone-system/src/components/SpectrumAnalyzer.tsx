import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { PlayArrow, Pause } from "@mui/icons-material";
import SpectrumWaterfall from "./SpectrumWaterfall";

const SpectrumAnalyzer: React.FC = () => {
  const FFT_SIZE = 2048;
  const [fft, setFft] = useState(new Array(FFT_SIZE).fill(-80));
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying) {
      timer = setInterval(() => {
        const arr = new Array(FFT_SIZE).fill(0).map((_, i) => {
          const noise = -90 + Math.random() * 8;

          // Create multiple tones across the spectrum
          const tone1 = -25 * Math.exp(-Math.pow((i - 200) / 30, 2));
          const tone2 = -35 * Math.exp(-Math.pow((i - 800) / 50, 2));
          const tone3 = -30 * Math.exp(-Math.pow((i - 1400) / 40, 2));

          return noise + tone1 + tone2 + tone3;
        });

        setFft(arr);
      }, 50);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, FFT_SIZE]);

  return (
    <Box sx={{ 
      p: 2, 
      color: '#00ff41', 
      fontFamily: '"Roboto Mono", monospace', 
      height: '100%',
      backgroundColor: '#0a0a0a',
      width: '100%',
      overflow: 'auto'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        borderBottom: '1px solid #00ff41',
        pb: 1
      }}>
        <Typography variant="h6" sx={{ color: '#00ff41', fontWeight: 'bold' }}>
          📡 ADVANCED SPECTRUM ANALYZER
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsPlaying(!isPlaying)}
          sx={{ 
            color: '#00ff41', 
            border: '1px solid #00ff41',
            '&:hover': { backgroundColor: 'rgba(0, 255, 65, 0.1)' }
          }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Box>

      {/* Spectrum Waterfall Component */}
      <Box sx={{ 
        border: '2px solid #00ff41',
        borderRadius: 1,
        overflow: 'auto',
        maxWidth: '100%'
      }}>
        <SpectrumWaterfall
          spectrumData={fft}
          width={870} // Adjusted to fit better in floating card
          height={500}
          minDb={-100}
          maxDb={-20}
        />
      </Box>

      {/* Status Information */}
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        border: '1px solid #333', 
        borderRadius: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        fontSize: '12px'
      }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#00ff41' }}>
          SYSTEM STATUS
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <div>FFT Size:</div>
          <div style={{ color: '#00ff41', fontWeight: 'bold' }}>{FFT_SIZE} points</div>
          
          <div>Update Rate:</div>
          <div style={{ color: '#00ff41', fontWeight: 'bold' }}>{isPlaying ? '20 Hz' : 'PAUSED'}</div>
          
          <div>Frequency Range:</div>
          <div style={{ color: '#00ff41', fontWeight: 'bold' }}>0 - 6000 MHz</div>
          
          <div>Dynamic Range:</div>
          <div style={{ color: '#00ff41', fontWeight: 'bold' }}>90 dB</div>
        </Box>
      </Box>
    </Box>
  );
};

export default SpectrumAnalyzer;