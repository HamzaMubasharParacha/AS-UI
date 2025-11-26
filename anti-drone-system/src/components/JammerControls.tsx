import React from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, Slider, Alert } from '@mui/material';
import { PlayArrow, Stop, PowerSettingsNew, Warning } from '@mui/icons-material';

interface JammerControlsProps {
  jammerStatus: 'stopped' | 'starting' | 'running' | 'stopping';
  onStart: () => void;
  onStop: () => void;
}

const JammerControls: React.FC<JammerControlsProps> = ({
  jammerStatus,
  onStart,
  onStop
}) => {
  const [frequencyBand, setFrequencyBand] = React.useState('2.4GHz');
  const [powerAttenuation, setPowerAttenuation] = React.useState(18);
  const [selectedMode, setSelectedMode] = React.useState('standard');

  const getStatusColor = () => {
    switch (jammerStatus) {
      case 'running':
        return '#ff4444';
      case 'starting':
      case 'stopping':
        return '#ff9800';
      default:
        return '#4CAF50';
    }
  };

  const getStatusText = () => {
    switch (jammerStatus) {
      case 'running':
        return 'JAMMING ACTIVE';
      case 'starting':
        return 'STARTING...';
      case 'stopping':
        return 'STOPPING...';
      default:
        return 'READY';
    }
  };

  const handleFrequencyChange = (event: any) => {
    setFrequencyBand(event.target.value);
  };

  const handleModeChange = (event: any) => {
    setSelectedMode(event.target.value);
  };

  const handlePowerChange = (event: Event, newValue: number | number[]) => {
    setPowerAttenuation(newValue as number);
  };

  return (
    <Box sx={{ p: 2, color: '#00ff41', fontFamily: '"Roboto Mono", monospace' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#00ff41', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PowerSettingsNew />
          JAMMER CONTROLS
        </Typography>
        <Box
          sx={{
            px: 2,
            py: 1,
            backgroundColor: getStatusColor(),
            borderRadius: 1,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '1px'
          }}
        >
          {getStatusText()}
        </Box>
      </Box>

      {/* Status Alert */}
      {jammerStatus === 'running' && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2, 
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            color: '#ff4444',
            border: '1px solid #ff4444',
            '& .MuiAlert-icon': { color: '#ff4444' }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            ⚠️ JAMMER ACTIVE - RF TRANSMISSION IN PROGRESS
          </Typography>
        </Alert>
      )}

      {/* Configuration Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, color: '#00ff41', fontWeight: 'bold' }}>
          CONFIGURATION
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Frequency Band Selection */}
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: '#00ff41' }}>Frequency Band</InputLabel>
            <Select
              value={frequencyBand}
              label="Frequency Band"
              onChange={handleFrequencyChange}
              disabled={jammerStatus === 'running' || jammerStatus === 'starting'}
              sx={{
                color: '#00ff41',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00ff41',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00ff41',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00ff41',
                },
              }}
            >
              <MenuItem value="2.4GHz">2.4 GHz (WiFi/Bluetooth)</MenuItem>
              <MenuItem value="5.8GHz">5.8 GHz (FPV Drones)</MenuItem>
              <MenuItem value="900MHz">900 MHz (Long Range)</MenuItem>
              <MenuItem value="1.2GHz">1.2 GHz (Video Transmission)</MenuItem>
            </Select>
          </FormControl>

          {/* Jamming Mode */}
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: '#00ff41' }}>Jamming Mode</InputLabel>
            <Select
              value={selectedMode}
              label="Jamming Mode"
              onChange={handleModeChange}
              disabled={jammerStatus === 'running' || jammerStatus === 'starting'}
              sx={{
                color: '#00ff41',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00ff41',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00ff41',
                },
              }}
            >
              <MenuItem value="standard">Standard Jamming</MenuItem>
              <MenuItem value="aggressive">Aggressive Jamming</MenuItem>
              <MenuItem value="selective">Selective Targeting</MenuItem>
              <MenuItem value="sweep">Frequency Sweep</MenuItem>
            </Select>
          </FormControl>

          {/* Power Attenuation */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Power Attenuation: {powerAttenuation} dB
            </Typography>
            <Slider
              value={powerAttenuation}
              onChange={handlePowerChange}
              min={0}
              max={30}
              step={1}
              disabled={jammerStatus === 'running' || jammerStatus === 'starting'}
              valueLabelDisplay="auto"
              sx={{
                color: '#00ff41',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#00ff41',
                },
                '& .MuiSlider-track': {
                  backgroundColor: '#00ff41',
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Control Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={onStart}
          disabled={jammerStatus === 'running' || jammerStatus === 'starting'}
          sx={{
            flex: 1,
            backgroundColor: '#ff4444',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#ff6666',
            },
            '&:disabled': {
              backgroundColor: '#666',
            },
          }}
        >
          START JAMMER
        </Button>

        <Button
          variant="contained"
          startIcon={<Stop />}
          onClick={onStop}
          disabled={jammerStatus === 'stopped' || jammerStatus === 'stopping'}
          sx={{
            flex: 1,
            backgroundColor: '#4CAF50',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#66bb6a',
            },
            '&:disabled': {
              backgroundColor: '#666',
            },
          }}
        >
          STOP JAMMER
        </Button>
      </Box>

      {/* Current Settings Display */}
      <Box sx={{ p: 2, border: '1px solid #333', borderRadius: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
          CURRENT SETTINGS:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '12px' }}>
          <div>Frequency Band:</div>
          <div style={{ color: '#00ff41', fontWeight: 'bold' }}>{frequencyBand}</div>
          
          <div>Jamming Mode:</div>
          <div style={{ color: '#00ff41', fontWeight: 'bold' }}>{selectedMode.toUpperCase()}</div>
          
          <div>Power Attenuation:</div>
          <div style={{ color: '#00ff41', fontWeight: 'bold' }}>{powerAttenuation} dB</div>
          
          <div>Status:</div>
          <div style={{ color: getStatusColor(), fontWeight: 'bold' }}>{getStatusText()}</div>
        </Box>
      </Box>

      {/* Safety Warning */}
      <Box sx={{ mt: 2, p: 1, border: '1px solid #ff9800', borderRadius: 1, backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
        <Typography variant="caption" sx={{ color: '#ff9800', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ fontSize: 16 }} />
          WARNING: Use jamming equipment only in authorized scenarios. Unauthorized use may violate regulations.
        </Typography>
      </Box>
    </Box>
  );
};

export default JammerControls;