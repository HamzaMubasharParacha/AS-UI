import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const MiniSpectrumAnalyzer = ({
  width = 300,
  height = 150,
  frequencyRange = [20, 6000],
  amplitudeRange = [-120, 0],
  showGrid = true,
  showLabels = true,
  updateInterval = 100, // ms
}) => {
  const canvasRef = useRef(null);
  const [spectrumData, setSpectrumData] = useState([]);
  const [peaks, setPeaks] = useState([]);
  const [activeSignals, setActiveSignals] = useState([]);

  // Initialize random signals that will drift and change
  useEffect(() => {
    // Create 3-5 random signals
    const initialSignals = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => ({
      frequency: frequencyRange[0] + Math.random() * (frequencyRange[1] - frequencyRange[0]),
      amplitude: -50 + Math.random() * 50, // -50 to 0 dBm
      width: 10 + Math.random() * 40, // MHz
      driftSpeed: (Math.random() - 0.5) * 2, // MHz per update
      amplitudeChange: (Math.random() - 0.5) * 1, // dB per update
      active: true,
    }));
    setActiveSignals(initialSignals);
  }, [frequencyRange]);

  // Generate realistic spectrum data with random peaks
  useEffect(() => {
    const generateSpectrumData = () => {
      const dataPoints = 200;
      const data = Array(dataPoints).fill(amplitudeRange[0]); // Start at min amplitude

      // Update signal positions
      const updatedSignals = activeSignals.map(signal => {
        let newFreq = signal.frequency + signal.driftSpeed;
        let newAmp = signal.amplitude + signal.amplitudeChange;
        
        // Bounce off boundaries
        if (newFreq < frequencyRange[0] || newFreq > frequencyRange[1]) {
          signal.driftSpeed *= -1;
          newFreq = signal.frequency;
        }
        
        // Keep amplitude in range
        if (newAmp < amplitudeRange[0] || newAmp > amplitudeRange[1]) {
          signal.amplitudeChange *= -1;
          newAmp = signal.amplitude;
        }
        
        // Randomly change parameters
        if (Math.random() > 0.95) {
          signal.driftSpeed = (Math.random() - 0.5) * 2;
        }
        if (Math.random() > 0.97) {
          signal.amplitudeChange = (Math.random() - 0.5) * 1;
        }
        if (Math.random() > 0.99) {
          signal.active = !signal.active; // Randomly turn on/off
        }
        
        return {
          ...signal,
          frequency: newFreq,
          amplitude: newAmp,
        };
      });

      setActiveSignals(updatedSignals);

      // Apply signals to spectrum
      updatedSignals.forEach(signal => {
        if (!signal.active) return;
        
        const normalizedFreq = (signal.frequency - frequencyRange[0]) / (frequencyRange[1] - frequencyRange[0]);
        const centerIndex = Math.floor(normalizedFreq * dataPoints);
        const signalWidth = Math.floor((signal.width / (frequencyRange[1] - frequencyRange[0])) * dataPoints);
        
        for (let i = -signalWidth; i <= signalWidth; i++) {
          const index = centerIndex + i;
          if (index >= 0 && index < dataPoints) {
            // Gaussian shape for signal
            const distance = Math.abs(i) / (signalWidth / 2);
            const signalValue = signal.amplitude * Math.exp(-(distance * distance) * 2);
            data[index] = Math.max(data[index], signalValue);
          }
        }
      });

      // Add random noise and interference
      for (let i = 0; i < dataPoints; i++) {
        // Add background noise
        data[i] += (Math.random() - 0.5) * 5 - 110;
        
        // Add occasional interference bursts
        if (Math.random() > 0.99) {
          const burstWidth = 2 + Math.random() * 5;
          for (let j = -burstWidth; j <= burstWidth; j++) {
            if (i + j >= 0 && i + j < dataPoints) {
              const distance = Math.abs(j) / burstWidth;
              data[i + j] = Math.max(data[i + j], -60 * (1 - distance));
            }
          }
        }
        
        // Add moving interference patterns
        const movingPattern = Math.sin(i * 0.1 + Date.now() * 0.001) * 3 - 100;
        data[i] = Math.max(data[i], movingPattern);
      }

      // Add wideband noise floor
      const noiseFloor = -90 + Math.sin(Date.now() * 0.0005) * 5;
      for (let i = 0; i < dataPoints; i++) {
        data[i] = Math.max(data[i], noiseFloor + (Math.random() - 0.5) * 3);
      }

      setSpectrumData(data);

      // Detect peaks
      const detectedPeaks = [];
      const peakThreshold = -80; // Only detect peaks above this level
      
      for (let i = 2; i < data.length - 2; i++) {
        // Simple peak detection
        if (
          data[i] > peakThreshold &&
          data[i] > data[i-1] && 
          data[i] > data[i+1] &&
          data[i] > data[i-2] && 
          data[i] > data[i+2]
        ) {
          const freq = frequencyRange[0] + (i / data.length) * (frequencyRange[1] - frequencyRange[0]);
          const amplitude = data[i];
          
          // Check if this is a new peak or part of existing one
          const existingPeakIndex = detectedPeaks.findIndex(p => 
            Math.abs(p.frequency - freq) < 50 // Within 50MHz
          );
          
          if (existingPeakIndex === -1) {
            detectedPeaks.push({
              frequency: Math.round(freq),
              amplitude: Math.round(amplitude),
              width: Math.round(20 + Math.random() * 30), // Random width
              type: amplitude > -60 ? 'HIGH' : amplitude > -80 ? 'MEDIUM' : 'LOW',
              id: Date.now() + i, // Unique ID
            });
          } else if (amplitude > detectedPeaks[existingPeakIndex].amplitude) {
            // Update if stronger
            detectedPeaks[existingPeakIndex] = {
              ...detectedPeaks[existingPeakIndex],
              frequency: Math.round(freq),
              amplitude: Math.round(amplitude),
            };
          }
        }
      }

      // Sort by amplitude and take top peaks
      const sortedPeaks = detectedPeaks.sort((a, b) => b.amplitude - a.amplitude);
      setPeaks(sortedPeaks.slice(0, 5));
    };

    generateSpectrumData();
    const interval = setInterval(generateSpectrumData, updateInterval);
    return () => clearInterval(interval);
  }, [activeSignals, frequencyRange, amplitudeRange, updateInterval]);

  // Draw spectrum on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spectrumData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
      ctx.lineWidth = 0.5;
      
      // Vertical grid lines (frequency)
      for (let i = 1; i < 5; i++) {
        const x = (width / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal grid lines (amplitude)
      for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Draw spectrum line
    ctx.beginPath();
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2;
    
    const xStep = width / (spectrumData.length - 1);
    const amplitudeRangeSize = amplitudeRange[1] - amplitudeRange[0];
    
    spectrumData.forEach((value, index) => {
      const x = index * xStep;
      const y = height - ((value - amplitudeRange[0]) / amplitudeRangeSize) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Fill under the curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 255, 65, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 65, 0)');
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Highlight peaks on the spectrum
    peaks.forEach(peak => {
      const normalizedFreq = (peak.frequency - frequencyRange[0]) / (frequencyRange[1] - frequencyRange[0]);
      const x = normalizedFreq * width;
      const y = height - ((peak.amplitude - amplitudeRange[0]) / amplitudeRangeSize) * height;
      
      // Draw peak marker
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = peak.type === 'HIGH' ? '#ff4444' : 
                     peak.type === 'MEDIUM' ? '#ffaa00' : '#00ff41';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw labels if enabled
    if (showLabels) {
      ctx.fillStyle = '#00ff41';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      
      // Frequency labels (bottom)
      for (let i = 0; i <= 5; i++) {
        const freq = frequencyRange[0] + (i / 5) * (frequencyRange[1] - frequencyRange[0]);
        const label = freq >= 1000 ? `${(freq/1000).toFixed(1)} GHz` : `${freq} MHz`;
        const x = (width / 5) * i;
        ctx.fillText(label, x, height - 2);
      }
      
      // Amplitude labels (left)
      ctx.textAlign = 'left';
      for (let i = 0; i <= 4; i++) {
        const amp = amplitudeRange[1] - (i / 4) * amplitudeRangeSize;
        const y = (height / 4) * i + 10;
        ctx.fillText(`${amp} dBm`, 2, y);
      }
    }

  }, [spectrumData, peaks, width, height, frequencyRange, amplitudeRange, showGrid, showLabels]);

  // Get color based on peak type
  const getPeakColor = (type) => {
    switch(type) {
      case 'HIGH': return '#ff4444';
      case 'MEDIUM': return '#ffaa00';
      default: return '#00ff41';
    }
  };

  // Get signal activity status
  const getActiveSignalCount = () => {
    return activeSignals.filter(s => s.active).length;
  };

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(0, 255, 65, 0.3)',
        borderRadius: '8px',
        padding: 2,
        width: 'fit-content',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: '#00ff41',
            fontFamily: 'monospace',
            textAlign: 'center',
          }}
        >
          SPECTRUM ANALYZER
        </Typography>
        
        <Box sx={{
          backgroundColor: 'rgba(0, 255, 65, 0.1)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#00ff41',
        }}>
          {getActiveSignalCount()} ACTIVE SIGNALS
        </Box>
      </Box>
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          borderRadius: '4px',
        }}
      />
      
      {/* Peak detection display */}
      <Box sx={{ mt: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(0, 255, 65, 0.7)',
            fontFamily: 'monospace',
            display: 'block',
            mb: 0.5,
          }}
        >
          DETECTED PEAKS ({peaks.length}):
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {peaks.map((peak, index) => (
            <Box
              key={peak.id || index}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: `1px solid ${getPeakColor(peak.type)}`,
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontFamily: 'monospace',
                color: getPeakColor(peak.type),
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getPeakColor(peak.type),
                }}
              />
              <span>
                {peak.frequency}MHz @ {peak.amplitude}dBm
              </span>
            </Box>
          ))}
          {peaks.length === 0 && (
            <Typography
              sx={{
                color: 'rgba(0, 255, 65, 0.5)',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontStyle: 'italic',
              }}
            >
              No significant peaks detected
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MiniSpectrumAnalyzer;