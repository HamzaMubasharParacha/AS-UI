import React from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Computer,
  Wifi,
  Battery90,
  Radar,
  CheckCircle,
  Error,
} from '@mui/icons-material';

interface SystemStatusProps {
  status: {
    radar: string;
    countermeasures: string;
    communications: string;
    power: number;
  };
}

const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'ONLINE':
      case 'READY':
        return '#00ff41';
      case 'WARNING':
        return '#ffaa00';
      case 'OFFLINE':
      case 'ERROR':
        return '#ff4444';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'ONLINE':
      case 'READY':
        return <CheckCircle sx={{ color: '#00ff41' }} />;
      case 'WARNING':
        return <Error sx={{ color: '#ffaa00' }} />;
      case 'OFFLINE':
      case 'ERROR':
        return <Error sx={{ color: '#ff4444' }} />;
      default:
        return <Computer sx={{ color: '#666' }} />;
    }
  };

  const getPowerColor = (power: number) => {
    if (power > 75) return '#00ff41';
    if (power > 50) return '#ffaa00';
    return '#ff4444';
  };

  const systemComponents = [
    {
      name: 'RADAR ARRAY',
      status: status.radar,
      icon: <Radar />,
    },
    {
      name: 'COUNTERMEASURES',
      status: status.countermeasures,
      icon: <Computer />,
    },
    {
      name: 'COMMUNICATIONS',
      status: status.communications,
      icon: <Wifi />,
    },
  ];

  return (
    <Paper sx={{ p: 2, height: '200px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Computer sx={{ mr: 1, color: '#00ff41' }} />
        <Typography variant="h6" sx={{ color: '#00ff41' }}>
          SYSTEM STATUS
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {systemComponents.map((component) => (
          <Box key={component.name} sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: 1,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {component.icon}
              <Typography variant="body2" sx={{ ml: 1, fontSize: '0.8rem' }}>
                {component.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getStatusIcon(component.status)}
              <Typography
                variant="caption"
                sx={{
                  ml: 1,
                  color: getStatusColor(component.status),
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              >
                {component.status}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Battery90 sx={{ color: getPowerColor(status.power) }} />
            <Typography variant="body2" sx={{ ml: 1, fontSize: '0.8rem' }}>
              POWER LEVEL
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: getPowerColor(status.power),
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          >
            {status.power}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={status.power}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: '#333',
            '& .MuiLinearProgress-bar': {
              backgroundColor: getPowerColor(status.power),
              borderRadius: 3,
            },
          }}
        />
      </Box>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Chip
          label={`SYSTEM ${status.radar === 'ONLINE' ? 'OPERATIONAL' : 'DEGRADED'}`}
          size="small"
          sx={{
            backgroundColor: status.radar === 'ONLINE' ? '#00ff41' : '#ffaa00',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '0.7rem',
          }}
        />
      </Box>
    </Paper>
  );
};

export default SystemStatus;