import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Shield,
  RadioButtonChecked,
  FlashOn,
  Block,
} from '@mui/icons-material';

interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}

interface CountermeasureControlsProps {
  activeThreat: DroneData | undefined;
  systemActive: boolean;
}

const CountermeasureControls: React.FC<CountermeasureControlsProps> = ({ 
  activeThreat, 
  systemActive 
}) => {
  const [activeCountermeasure, setActiveCountermeasure] = useState<string | null>(null);
  const [jammerActive, setJammerActive] = useState(false);
  const [laserActive, setLaserActive] = useState(false);

  const handleCountermeasure = (type: string) => {
    if (!systemActive || !activeThreat) return;
    
    setActiveCountermeasure(type);
    
    if (type === 'jammer') {
      setJammerActive(true);
      setTimeout(() => {
        setJammerActive(false);
        setActiveCountermeasure(null);
      }, 5000);
    } else if (type === 'laser') {
      setLaserActive(true);
      setTimeout(() => {
        setLaserActive(false);
        setActiveCountermeasure(null);
      }, 3000);
    }
  };

  const countermeasures = [
    {
      id: 'jammer',
      name: 'RF JAMMER',
      icon: <RadioButtonChecked />,
      description: 'Disrupt drone communications',
      color: '#ffaa00',
      disabled: !activeThreat || jammerActive,
    },
    {
      id: 'laser',
      name: 'LASER SYSTEM',
      icon: <FlashOn />,
      description: 'Disable drone sensors',
      color: '#ff4444',
      disabled: !activeThreat || laserActive,
    },
    {
      id: 'net',
      name: 'NET LAUNCHER',
      icon: <Block />,
      description: 'Physical capture system',
      color: '#00ff41',
      disabled: !activeThreat || (activeThreat && activeThreat.distance > 100),
    },
  ];

  return (
    <Paper sx={{ p: 2, height: '300px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Shield sx={{ mr: 1, color: '#00ff41' }} />
        <Typography variant="h6" sx={{ color: '#00ff41' }}>
          COUNTERMEASURES
        </Typography>
      </Box>

      {!systemActive && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          System offline - Countermeasures unavailable
        </Alert>
      )}

      {systemActive && !activeThreat && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No active threats detected
        </Alert>
      )}

      {activeThreat && (
        <Box sx={{ mb: 2, p: 1, backgroundColor: '#1a1a1a', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            TARGET LOCKED
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {activeThreat.id}
          </Typography>
          <Typography variant="caption" sx={{ color: '#ff4444' }}>
            {activeThreat.threat_level} - {activeThreat.distance.toFixed(0)}m
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {countermeasures.map((countermeasure) => (
          <Button
            key={countermeasure.id}
            variant="outlined"
            disabled={countermeasure.disabled}
            onClick={() => handleCountermeasure(countermeasure.id)}
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              borderColor: countermeasure.color,
              color: countermeasure.disabled ? '#666' : countermeasure.color,
              '&:hover': {
                borderColor: countermeasure.color,
                backgroundColor: `${countermeasure.color}20`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {countermeasure.icon}
              <Box sx={{ ml: 1, flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {countermeasure.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {countermeasure.description}
                </Typography>
              </Box>
              {activeCountermeasure === countermeasure.id && (
                <Chip size="small" label="ACTIVE" color="error" />
              )}
            </Box>
          </Button>
        ))}
      </Box>

      {activeCountermeasure && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            COUNTERMEASURE ACTIVE
          </Typography>
          <LinearProgress
            sx={{
              mt: 1,
              backgroundColor: '#333',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ff4444',
              },
            }}
          />
        </Box>
      )}

      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #333' }}>
        <Typography variant="caption" sx={{ color: '#666' }}>
          Status: {systemActive ? 'READY' : 'OFFLINE'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CountermeasureControls;