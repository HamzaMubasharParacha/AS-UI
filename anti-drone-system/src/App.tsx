import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Box,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
} from '@mui/material';
import {
  Radar,
  Shield,
  Settings,
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CesiumMap from './components/CesiumMap';
import DroneDetectionPanel from './components/DroneDetectionPanel';
import ThreatAssessment from './components/ThreatAssessment';
import CountermeasureControls from './components/CountermeasureControls';
import SystemStatus from './components/SystemStatus';
import DataVisualization from './components/DataVisualization';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff41',
    },
    secondary: {
      main: '#ff4444',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffaa00',
    },
    success: {
      main: '#00ff41',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace',
    h4: {
      fontWeight: 700,
      letterSpacing: '0.1em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #333',
        },
      },
    },
  },
});

interface DroneData {
  id: string;
  position: [number, number, number];
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  distance: number;
  speed: number;
  heading: number;
  detected_at: string;
}

function App() {
  const [systemActive, setSystemActive] = useState(true);
  const [detectedDrones, setDetectedDrones] = useState<DroneData[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [systemStatus, setSystemStatus] = useState({
    radar: 'ONLINE',
    countermeasures: 'READY',
    communications: 'ONLINE',
    power: 98,
  });

  // Initialize with some sample drone data positioned within 5KM of command center
  // Command center is at: 72.9877674, 33.6375773
  useEffect(() => {
    const initialDrones: DroneData[] = [
      {
        id: 'DRONE_001',
        position: [72.9977674, 33.6475773, 150], // ~1.1km NE of command center
        threat_level: 'HIGH',
        distance: 1100,
        speed: 25,
        heading: 45,
        detected_at: new Date().toISOString(),
      },
      {
        id: 'DRONE_002',
        position: [72.9777674, 33.6275773, 200], // ~2.2km SW of command center
        threat_level: 'MEDIUM',
        distance: 2200,
        speed: 18,
        heading: 180,
        detected_at: new Date().toISOString(),
      },
      {
        id: 'DRONE_003',
        position: [72.9827674, 33.6425773, 100], // ~0.6km W of command center
        threat_level: 'CRITICAL',
        distance: 600,
        speed: 35,
        heading: 270,
        detected_at: new Date().toISOString(),
      },
      {
        id: 'DRONE_004',
        position: [73.0077674, 33.6375773, 300], // ~2.0km E of command center
        threat_level: 'LOW',
        distance: 2000,
        speed: 15,
        heading: 90,
        detected_at: new Date().toISOString(),
      },
      {
        id: 'DRONE_005',
        position: [72.9877674, 33.6575773, 250], // ~2.2km N of command center
        threat_level: 'MEDIUM',
        distance: 2200,
        speed: 22,
        heading: 315,
        detected_at: new Date().toISOString(),
      },
      {
        id: 'DRONE_006',
        position: [72.9677674, 33.6175773, 180], // ~3.1km S of command center
        threat_level: 'HIGH',
        distance: 3100,
        speed: 30,
        heading: 120,
        detected_at: new Date().toISOString(),
      },
      {
        id: 'DRONE_007',
        position: [73.0177674, 33.6575773, 220], // ~3.5km NE of command center
        threat_level: 'CRITICAL',
        distance: 3500,
        speed: 40,
        heading: 225,
        detected_at: new Date().toISOString(),
      },
    ];
    
    setDetectedDrones(initialDrones);
  }, []);

  // Simulate drone detection updates
  useEffect(() => {
    if (!systemActive) return;

    const interval = setInterval(() => {
      // Update existing drones with new positions and occasionally add new ones
      setDetectedDrones(prev => {
        const updated = prev.map(drone => ({
          ...drone,
          position: [
            drone.position[0] + (Math.random() - 0.5) * 0.001,
            drone.position[1] + (Math.random() - 0.5) * 0.001,
            drone.position[2] + (Math.random() - 0.5) * 10,
          ] as [number, number, number],
          distance: Math.max(50, drone.distance + (Math.random() - 0.5) * 100),
          speed: Math.max(5, drone.speed + (Math.random() - 0.5) * 5),
          heading: (drone.heading + (Math.random() - 0.5) * 20) % 360,
        }));

        // Occasionally add new drone detections within 5KM of command center
        if (Math.random() < 0.2 && updated.length < 10) {
          const newDrone: DroneData = {
            id: `DRONE_${String(Date.now()).slice(-3)}`,
            position: [
              72.9877674 + (Math.random() - 0.5) * 0.08, // Within ~4.4km range
              33.6375773 + (Math.random() - 0.5) * 0.08, // Within ~4.4km range
              Math.random() * 400 + 50,
            ],
            threat_level: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
            distance: Math.random() * 4500 + 200, // Within 5KM range
            speed: Math.random() * 40 + 10,
            heading: Math.random() * 360,
            detected_at: new Date().toISOString(),
          };
          updated.push(newDrone);
        }

        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [systemActive]);

  const activeThreat = detectedDrones.find(drone => 
    drone.threat_level === 'HIGH' || drone.threat_level === 'CRITICAL'
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)' }}>
          <Toolbar>
            <Shield sx={{ mr: 2, color: '#00ff41' }} />
            <Typography variant="h4" component="div" sx={{ flexGrow: 1, color: '#00ff41' }}>
              ANTI-DRONE SYSTEM
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                icon={<Radar />} 
                label={`${detectedDrones.length} TARGETS`} 
                color={detectedDrones.length > 0 ? 'error' : 'success'}
                variant="outlined"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemActive}
                    onChange={(e) => setSystemActive(e.target.checked)}
                    color="success"
                  />
                }
                label="SYSTEM ACTIVE"
              />
              <IconButton color="inherit">
                <Settings />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {activeThreat && (
          <Alert 
            severity="error" 
            sx={{ 
              backgroundColor: '#ff4444', 
              color: '#fff',
              '& .MuiAlert-icon': { color: '#fff' }
            }}
          >
            <Typography variant="h6">
              CRITICAL THREAT DETECTED - DRONE {activeThreat.id} AT {activeThreat.distance.toFixed(0)}M
            </Typography>
          </Alert>
        )}

        <Box sx={{ flexGrow: 1, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 120px)' }}>
            {/* Main Map View */}
            <Box sx={{ flex: '2', minWidth: 0 }}>
              <Paper sx={{ height: '100%', position: 'relative' }}>
                <CesiumMap drones={detectedDrones} systemActive={systemActive} />
              </Paper>
            </Box>

            {/* Control Panels */}
            <Box sx={{ flex: '1', display: 'flex', flexDirection: 'column', gap: 2, minWidth: '300px' }}>
              {/* System Status */}
              <SystemStatus status={systemStatus} />

              {/* Drone Detection */}
              <DroneDetectionPanel drones={detectedDrones} />

              {/* Threat Assessment */}
              <ThreatAssessment drones={detectedDrones} />

              {/* Countermeasures */}
              <CountermeasureControls
                activeThreat={activeThreat}
                systemActive={systemActive}
              />
            </Box>
          </Box>

          {/* Data Visualization */}
          <Box sx={{ mt: 2 }}>
            <DataVisualization drones={detectedDrones} />
          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
}

export default App;
