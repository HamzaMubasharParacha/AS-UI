import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, FormControl, InputLabel, Select, MenuItem, Slider, Switch, FormControlLabel } from '@mui/material';
import { PlayArrow, Pause, ZoomOutMap, Warning } from '@mui/icons-material';

interface SpectrumPoint {
    x: number;
    y: number;
    signalType: 'noise' | 'wifi' | 'drone' | 'interference';
}

const SimpleSpectrum: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [frequencyRange, setFrequencyRange] = useState<[number, number]>([2400, 2500]);
    const [selectedBand, setSelectedBand] = useState('2.4GHz');
    const [amplitudeRange, setAmplitudeRange] = useState<[number, number]>([-120, 20]);
    const [spectrumData, setSpectrumData] = useState<SpectrumPoint[]>([]);
    const [detectedSignals, setDetectedSignals] = useState<Array<{frequency: number, amplitude: number, type: string}>>([]);

    // Generate realistic spectrum data
    const generateSpectrumData = () => {
        const data: SpectrumPoint[] = [];
        const [minFreq, maxFreq] = frequencyRange;
        const steps = 512;

        const baseNoise = -90;
        
        for (let i = 0; i <= steps; i++) {
            const frequency = minFreq + (i / steps) * (maxFreq - minFreq);
            let amplitude = baseNoise;
            
            // Background noise
            amplitude += Math.random() * 5 - 2.5;
            
            // Periodic signals
            amplitude += Math.sin(frequency * 0.02) * 3;
            amplitude += Math.sin(frequency * 0.035) * 2;
            
            // WiFi signals
            if ((frequency >= 2412 && frequency <= 2472)) {
                amplitude += Math.random() * 25 + 15;
            }
            
            // Drone signals
            const droneFrequencies = [
                { center: 2425, width: 10, strength: 35 },
                { center: 2435, width: 8, strength: 40 },
                { center: 2450, width: 12, strength: 38 },
            ];
            
            droneFrequencies.forEach(drone => {
                if (Math.abs(frequency - drone.center) < drone.width) {
                    const distance = Math.abs(frequency - drone.center);
                    const signalStrength = drone.strength * (1 - distance / drone.width);
                    amplitude += signalStrength;
                }
            });
            
            // Random interference
            if (Math.random() < 0.01) {
                amplitude += Math.random() * 30 + 20;
            }

            let signalType: SpectrumPoint['signalType'] = 'noise';
            if (amplitude > -50) signalType = 'interference';
            if (amplitude > -30) signalType = 'wifi';
            if (amplitude > -10) signalType = 'drone';

            data.push({
                x: frequency,
                y: Math.max(amplitudeRange[0], Math.min(amplitudeRange[1], amplitude)),
                signalType
            });
        }

        return data;
    };

    // Draw spectrum on canvas
    const drawSpectrum = (data: SpectrumPoint[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.font = '10px "Roboto Mono"';
        ctx.fillStyle = '#666';

        // Horizontal grid (amplitude)
        for (let i = amplitudeRange[0]; i <= amplitudeRange[1]; i += 20) {
            const y = height - ((i - amplitudeRange[0]) / (amplitudeRange[1] - amplitudeRange[0])) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.fillText(`${i} dBm`, 5, y - 2);
        }

        // Vertical grid (frequency)
        for (let i = frequencyRange[0]; i <= frequencyRange[1]; i += 20) {
            const x = ((i - frequencyRange[0]) / (frequencyRange[1] - frequencyRange[0])) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.fillText(`${i} MHz`, x - 15, height - 5);
        }

        // Draw spectrum line
        if (data.length > 0) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00ff41';

            data.forEach((point, index) => {
                const x = ((point.x - frequencyRange[0]) / (frequencyRange[1] - frequencyRange[0])) * width;
                const y = height - ((point.y - amplitudeRange[0]) / (amplitudeRange[1] - amplitudeRange[0])) * height;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // Highlight signals
                if (point.signalType === 'drone') {
                    ctx.fillStyle = '#ff4444';
                    ctx.fillRect(x - 2, y - 2, 4, 4);
                } else if (point.signalType === 'wifi') {
                    ctx.fillStyle = '#ffaa00';
                    ctx.fillRect(x - 1, y - 1, 2, 2);
                }
            });

            ctx.stroke();
        }

        // Draw title
        ctx.fillStyle = '#00ff41';
        ctx.font = '12px "Roboto Mono"';
        ctx.fillText(`SPECTRUM ANALYZER - ${selectedBand}`, 10, 15);
    };

    // Detect signals
    const detectSignals = (data: SpectrumPoint[]) => {
        const signals: Array<{frequency: number, amplitude: number, type: string}> = [];
        const threshold = -40;
        
        for (let i = 1; i < data.length - 1; i++) {
            const point = data[i];
            const prev = data[i - 1];
            const next = data[i + 1];
            
            if (point.y > threshold && point.y > prev.y && point.y > next.y) {
                let type = 'Unknown';
                if (point.y > -10) type = '🚨 DRONE SIGNAL';
                else if (point.y > -30) type = '📡 WiFi SIGNAL';
                else type = '⚡ INTERFERENCE';
                
                signals.push({
                    frequency: point.x,
                    amplitude: point.y,
                    type
                });
            }
        }
        
        return signals.slice(0, 10);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (isPlaying) {
            interval = setInterval(() => {
                const newData = generateSpectrumData();
                setSpectrumData(newData);
                drawSpectrum(newData);
                setDetectedSignals(detectSignals(newData));
            }, 100);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, frequencyRange, amplitudeRange, selectedBand]);

    const handleBandChange = (event: any) => {
        const band = event.target.value;
        setSelectedBand(band);
        
        switch (band) {
            case '2.4GHz':
                setFrequencyRange([2400, 2500]);
                break;
            case '5.8GHz':
                setFrequencyRange([5725, 5875]);
                break;
            case '900MHz':
                setFrequencyRange([902, 928]);
                break;
            default:
                setFrequencyRange([2400, 2500]);
        }
    };

    return (
        <Box sx={{ p: 2, color: '#00ff41', fontFamily: '"Roboto Mono", monospace', height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00ff41', fontWeight: 'bold' }}>
                    📡 SPECTRUM ANALYZER
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                        size="small"
                        onClick={() => setIsPlaying(!isPlaying)}
                        sx={{ color: '#00ff41', border: '1px solid #00ff41' }}
                    >
                        {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>
                </Box>
            </Box>

            {/* Controls */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: '#00ff41' }}>Frequency Band</InputLabel>
                    <Select
                        value={selectedBand}
                        label="Frequency Band"
                        onChange={handleBandChange}
                        sx={{
                            color: '#00ff41',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff41' },
                        }}
                    >
                        <MenuItem value="2.4GHz">2.4 GHz</MenuItem>
                        <MenuItem value="5.8GHz">5.8 GHz</MenuItem>
                        <MenuItem value="900MHz">900 MHz</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Amplitude Range: {amplitudeRange[0]} to {amplitudeRange[1]} dBm
                    </Typography>
                    <Slider
                        value={amplitudeRange}
                        onChange={(_, newValue) => setAmplitudeRange(newValue as [number, number])}
                        min={-120}
                        max={20}
                        valueLabelDisplay="auto"
                        sx={{
                            color: '#00ff41',
                            '& .MuiSlider-thumb': { backgroundColor: '#00ff41' },
                        }}
                    />
                </Box>
            </Box>

            {/* Canvas for spectrum display */}
            <Box sx={{ border: '2px solid #00ff41', borderRadius: 1, backgroundColor: '#0a0a0a', p: 1 }}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    style={{ display: 'block', width: '100%', height: '400px' }}
                />
            </Box>
        </Box>
    );
};

export default SimpleSpectrum;