import React, { useState, useEffect, useCallback } from 'react';
import {Typography,Box,IconButton,Button,} from '@mui/material';
import {Dashboard,Radar,Assessment,Security,BarChart,Timeline,PieChart,ShowChart,ChevronLeft,ChevronRight,Close as CloseIcon,Edit,Polyline,CropFree,Room,Straighten,} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import CesiumMap from './CesiumMap';
import DroneDetectionPanel from './DroneDetectionPanel';
import ThreatAssessment from './ThreatAssessment';
import CountermeasureControls from './CountermeasureControls';
import SystemStatus from './SystemStatus';
import DataVisualization from './DataVisualization';
import '../ADSDashboard.css';

interface DashboardProps {
  setToken: (token: string | null) => void;
}

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

interface FloatingCard {
  id: string;
  title: string;
  component: string;
  position: { x: number; y: number };
  visible: boolean;
  minimized: boolean;
  lastActivity: string;
  status: 'active' | 'inactive' | 'warning' | 'error';
}

interface CardLog {
  id: string;
  title: string;
  status: 'active' | 'inactive' | 'warning' | 'error';
  lastActivity: string;
  description: string;
  icon: React.ReactNode;
}

const ADSDashboard: React.FC<DashboardProps> = ({ setToken }) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogout = async () => {
        setLoading(true);
        setError('');

        try {
            const token = sessionStorage.getItem('authToken');
            console.log("Logging out with token (encrypted):", token);

            if (!token) {
                setError('No authentication token found');
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:9090/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                console.log("Logout successful");
                sessionStorage.removeItem('authToken');
                setToken(null); // triggers re-render → redirects to LoginPage
            }    else {
                const data = await response.json();
                setError(data.message || 'Logout failed');
            }
        
        } catch (err) {
        
            console.error('Logout error:', err);
            setError('Failed to connect to server');
        
        } finally {
      
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) setToken(storedToken);
    }, []);

    const [systemActive] = useState(true);
    const [detectedDrones, setDetectedDrones] = useState<DroneData[]>([]);
    const [drawingToolsEnabled, setDrawingToolsEnabled] = useState(false);
  
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        draggedCardId: string | null;
        dragOffset: { x: number; y: number };
        startPosition: { x: number; y: number };
    }>({
        isDragging: false,
        draggedCardId: null,
        dragOffset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 }
    });

    const [floatingCards, setFloatingCards] = useState<FloatingCard[]>([
        
        {
            id: 'system-status',
            title: 'System Status',
            component: 'SystemStatus',
            position: { x: 100, y: 100 },
            visible: false,
            minimized: false,
            lastActivity: new Date().toLocaleTimeString(),
            status: 'active',
        },
        {
            id: 'drone-detection',
            title: 'Drone Detection',
            component: 'DroneDetectionPanel',
            position: { x: 450, y: 100 },
            visible: false,
            minimized: false,
            lastActivity: new Date().toLocaleTimeString(),
            status: 'active',
        },
        {
            id: 'threat-assessment',
            title: 'Threat Assessment',
            component: 'ThreatAssessment',
            position: { x: 100, y: 350 },
            visible: false,
            minimized: false,
            lastActivity: new Date().toLocaleTimeString(),
            status: 'warning',
        },
        {
            id: 'countermeasures',
            title: 'Countermeasures',
            component: 'CountermeasureControls',
            position: { x: 450, y: 350 },
            visible: false,
            minimized: false,
            lastActivity: new Date().toLocaleTimeString(),
            status: 'inactive',
        },
        {
            id: 'drawing-tools',
            title: 'Map Drawing Tools',
            component: 'DrawingTools',
            position: { x: 200, y: 200 },
            visible: false,
            minimized: false,
            lastActivity: new Date().toLocaleTimeString(),
            status: 'inactive',
        },
        {
            id: 'data-visualization',
            title: 'Data Analytics',
            component: 'DataVisualization',
            position: { x: 800, y: 100 },
            visible: false,
            minimized: false,
            lastActivity: new Date().toLocaleTimeString(),
            status: 'active',
        },
    ]);

    const [systemStatus] = useState({
        radar: 'ONLINE',
        countermeasures: 'READY',
        communications: 'ONLINE',
        power: 98,
    });

    // Initialize with sample drone data
    useEffect(() => {

        const initialDrones: DroneData[] = [
            
            {
                id: 'DRONE_001',
                position: [72.9977674, 33.6475773, 150],
                threat_level: 'HIGH',
                distance: 1100,
                speed: 25,
                heading: 45,
                detected_at: new Date().toISOString(),
            },
            {
                id: 'DRONE_002',
                position: [72.9777674, 33.6275773, 200],
                threat_level: 'MEDIUM',
                distance: 2200,
                speed: 18,
                heading: 180,
                detected_at: new Date().toISOString(),
            },
            {
                id: 'DRONE_003',
                position: [72.9827674, 33.6425773, 100],
                threat_level: 'CRITICAL',
                distance: 600,
                speed: 35,
                heading: 270,
                detected_at: new Date().toISOString(),
            },
            {
                id: 'DRONE_004',
                position: [73.0077674, 33.6375773, 300],
                threat_level: 'LOW',
                distance: 2000,
                speed: 15,
                heading: 90,
                detected_at: new Date().toISOString(),
            },
            {
                id: 'DRONE_005',
                position: [72.9877674, 33.6575773, 250],
                threat_level: 'MEDIUM',
                distance: 2200,
                speed: 22,
                heading: 315,
                detected_at: new Date().toISOString(),
            },
        ];
    
        setDetectedDrones(initialDrones);

    }, []);

    // Simulate drone detection updates
    useEffect(() => {
        
        if (!systemActive) return;

        const interval = setInterval(() => {
      
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

                if (Math.random() < 0.2 && updated.length < 10) {
          
                    const newDrone: DroneData = {
        
                        id: `DRONE_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            
                        position: [
                            72.9877674 + (Math.random() - 0.5) * 0.08,
                            33.6375773 + (Math.random() - 0.5) * 0.08,
                            Math.random() * 400 + 50,
                        ],

                        threat_level: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
                        distance: Math.random() * 4500 + 200,
                        speed: Math.random() * 40 + 10,
                        heading: Math.random() * 360,
                        detected_at: new Date().toISOString(),
                    };
          
                    updated.push(newDrone);
                }
                return updated;
            });

            // Update card activity timestamps
            setFloatingCards(prev => prev.map(card => ({
                ...card,
                lastActivity: new Date().toLocaleTimeString(),
                status: card.visible ? 'active' : card.status,
            })));
    
        }, 3000);
    
        return () => clearInterval(interval);
  
    }, [systemActive]);

    const activeThreat = detectedDrones.find(drone => 
        drone.threat_level === 'HIGH' || drone.threat_level === 'CRITICAL'
    );

  
    const toggleCard = (cardId: string) => {
    
        setFloatingCards(prev => prev.map(card =>
      
            card.id === cardId ? { 
        
                ...card, 
        
                visible: !card.visible,
        
                lastActivity: new Date().toLocaleTimeString(),
        
                status: !card.visible ? 'active' : 'inactive'
      
            } : card
    
        ));
  
    };
    

  
    const minimizeCard = (cardId: string) => {
    
        setFloatingCards(prev => prev.map(card =>
      
            card.id === cardId ? { ...card, minimized: !card.minimized } : card
    
        ));
  
    };

  
    const updateCardPosition = (cardId: string, newPosition: { x: number; y: number }) => {
    
        setFloatingCards(prev => prev.map(card =>
      
            card.id === cardId ? { ...card, position: newPosition } : card
    
        ));
  
    };

  
    const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    
        e.preventDefault();
    
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
        const startX = e.clientX - rect.left;
    
        const startY = e.clientY - rect.top;
    
    
        setDragState({
      
            isDragging: true,
      
            draggedCardId: cardId,
      
            dragOffset: { x: startX, y: startY },
      
            startPosition: { x: e.clientX, y: e.clientY }
    
        });
  
    };

  
    const handleTouchStart = (e: React.TouchEvent, cardId: string) => {
    
        e.preventDefault();
    
        const touch = e.touches[0];
    
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
        const startX = touch.clientX - rect.left;
    
        const startY = touch.clientY - rect.top;
    
    
        setDragState({
    
            isDragging: true,
    
            draggedCardId: cardId,
    
            dragOffset: { x: startX, y: startY },
    
            startPosition: { x: touch.clientX, y: touch.clientY }
    
        });
  
    };

  
    const handleMouseMove = useCallback((e: MouseEvent) => {
    
        if (!dragState.isDragging || !dragState.draggedCardId) return;
    
    
        const newX = Math.max(20, Math.min(window.innerWidth - 400, e.clientX - dragState.dragOffset.x));
    
        const newY = Math.max(20, Math.min(window.innerHeight - 250, e.clientY - dragState.dragOffset.y));
    
    
        updateCardPosition(dragState.draggedCardId, { x: newX, y: newY });
  
    }, [dragState.isDragging, dragState.draggedCardId, dragState.dragOffset.x, dragState.dragOffset.y]);

  
    const handleTouchMove = useCallback((e: TouchEvent) => {
    
        if (!dragState.isDragging || !dragState.draggedCardId) return;
    
    
        const touch = e.touches[0];
    
        const newX = Math.max(20, Math.min(window.innerWidth - 400, touch.clientX - dragState.dragOffset.x));
    
        const newY = Math.max(20, Math.min(window.innerHeight - 250, touch.clientY - dragState.dragOffset.y));
    
    
        updateCardPosition(dragState.draggedCardId, { x: newX, y: newY });
  
    }, [dragState.isDragging, dragState.draggedCardId, dragState.dragOffset.x, dragState.dragOffset.y]);

  
    const handleMouseUp = () => {
    
        setDragState({
      
            isDragging: false,
      
            draggedCardId: null,
      
            dragOffset: { x: 0, y: 0 },
      
            startPosition: { x: 0, y: 0 }
    
        });
  
    };

  
    const handleTouchEnd = () => {
    
        setDragState({
    
            isDragging: false,
    
            draggedCardId: null,
    
            dragOffset: { x: 0, y: 0 },
    
            startPosition: { x: 0, y: 0 }
    
        });
  
    };

  
    useEffect(() => {
    
        if (dragState.isDragging) {
      
            document.addEventListener('mousemove', handleMouseMove);
      
            document.addEventListener('mouseup', handleMouseUp);
      
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
            document.addEventListener('touchend', handleTouchEnd);
      
      
            return () => {
        
                document.removeEventListener('mousemove', handleMouseMove);
        
                document.removeEventListener('mouseup', handleMouseUp);
        
                document.removeEventListener('touchmove', handleTouchMove);
        
                document.removeEventListener('touchend', handleTouchEnd);
      
            };
    
        }
  
    }, [dragState.isDragging, handleMouseMove, handleTouchMove]);

  
    const renderCardContent = (card: FloatingCard) => {
    
        switch (card.component) {
      
            case 'SystemStatus':
        
            return <SystemStatus status={systemStatus} />;
      
            case 'DroneDetectionPanel':
        
            return <DroneDetectionPanel drones={detectedDrones} />;
      
            case 'ThreatAssessment':
        
            return <ThreatAssessment drones={detectedDrones} />;
      
            case 'CountermeasureControls':
        
            return <CountermeasureControls activeThreat={activeThreat} systemActive={systemActive} />;
      
            case 'DrawingTools':
        
            return (
            <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#00ff41' }}>
              Map Drawing Tools
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  border: '1px solid #00ff41',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0, 255, 65, 0.1)' }
                }}
                onClick={() => setDrawingToolsEnabled(!drawingToolsEnabled)}
              >
                <Typography variant="body2">
                  Drawing Tools: {drawingToolsEnabled ? 'ENABLED' : 'DISABLED'}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#888', mt: 1 }}>
                Available Tools:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Polyline sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Polygon</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CropFree sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Rectangle</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Room sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Circle</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Straighten sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Line</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      case 'DataVisualization':
        return <DataVisualization drones={detectedDrones} />;
      default:
        return <Box>Unknown component</Box>;
    }
  };

  const leftCardLogs: CardLog[] = [
    {
      id: 'system-status',
      title: 'System Status',
      status: floatingCards.find(c => c.id === 'system-status')?.status || 'inactive',
      lastActivity: floatingCards.find(c => c.id === 'system-status')?.lastActivity || '',
      description: 'System health and operational status',
      icon: <Dashboard />,
    },
    {
      id: 'drone-detection',
      title: 'Drone Detection',
      status: floatingCards.find(c => c.id === 'drone-detection')?.status || 'inactive',
      lastActivity: floatingCards.find(c => c.id === 'drone-detection')?.lastActivity || '',
      description: `${detectedDrones.length} active targets detected`,
      icon: <Radar />,
    },
    {
      id: 'threat-assessment',
      title: 'Threat Assessment',
      status: activeThreat ? 'error' : 'active',
      lastActivity: floatingCards.find(c => c.id === 'threat-assessment')?.lastActivity || '',
      description: activeThreat ? `Critical threat: ${activeThreat.id}` : 'No active threats',
      icon: <Assessment />,
    },
    {
      id: 'countermeasures',
      title: 'Countermeasures',
      status: systemActive ? 'active' : 'inactive',
      lastActivity: floatingCards.find(c => c.id === 'countermeasures')?.lastActivity || '',
      description: systemActive ? 'Systems armed and ready' : 'Systems offline',
      icon: <Security />,
    },
    {
      id: 'drawing-tools',
      title: 'Drawing Tools',
      status: drawingToolsEnabled ? 'active' : 'inactive',
      lastActivity: floatingCards.find(c => c.id === 'drawing-tools')?.lastActivity || '',
      description: drawingToolsEnabled ? 'Drawing tools enabled' : 'Drawing tools disabled',
      icon: <Edit />,
    },
  ];

  const rightCardLogs: CardLog[] = [
    {
      id: 'data-visualization',
      title: 'Data Analytics',
      status: floatingCards.find(c => c.id === 'data-visualization')?.status || 'inactive',
      lastActivity: floatingCards.find(c => c.id === 'data-visualization')?.lastActivity || '',
      description: 'Real-time data analysis and charts',
      icon: <BarChart />,
    },
    {
      id: 'timeline-view',
      title: 'Timeline View',
      status: 'inactive',
      lastActivity: new Date().toLocaleTimeString(),
      description: 'Historical event timeline',
      icon: <Timeline />,
    },
    {
      id: 'distribution-chart',
      title: 'Distribution Analysis',
      status: 'inactive',
      lastActivity: new Date().toLocaleTimeString(),
      description: 'Threat distribution patterns',
      icon: <PieChart />,
    },
    {
      id: 'trend-analysis',
      title: 'Trend Analysis',
      status: 'inactive',
      lastActivity: new Date().toLocaleTimeString(),
      description: 'Long-term trend monitoring',
      icon: <ShowChart />,
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        {/* Main Container */}
        <div className="main-container">
          {/* Application Header */}
          <div className="app-header">
            <Typography variant="h5" className="app-title">
              ANTI-DRONE-SYSTEM
            </Typography>
            <div className="header-status">
              <div className="status-dot active"></div>
              <span className="status-text">OPERATIONAL</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outlined"
              sx={{
                color: '#ff4444',
                borderColor: '#ff4444',
                ml: 2,
                '&:hover': { borderColor: '#ff6666', color: '#ff6666' },
              }}
            >
              Logout
            </Button>

          </div>

          {/* Full Screen Map */}
          <div className="map-container">
            <CesiumMap drones={detectedDrones} systemActive={systemActive} drawingToolsEnabled={drawingToolsEnabled} />
          </div>


          {/* Floating Cards */}
          {floatingCards.filter(card => card.visible).map((card) => (
            <Box
              key={card.id}
              className={`floating-card ${card.minimized ? 'floating-card-minimized' : ''} ${
                dragState.draggedCardId === card.id ? 'floating-card-dragging' : ''
              }`}
              sx={{
                left: card.position.x,
                top: card.position.y,
              }}
              onMouseDown={(e) => handleMouseDown(e, card.id)}
              onTouchStart={(e) => handleTouchStart(e, card.id)}
            >
              <Box className="floating-card-header">
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#00ff41' }}>
                  {card.title}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => minimizeCard(card.id)}
                    sx={{ color: '#00ff41', p: 0.5 }}
                  >
                    {card.minimized ? <ChevronRight /> : <ChevronLeft />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => toggleCard(card.id)}
                    sx={{ color: '#ff4444', p: 0.5, ml: 0.5 }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
              {!card.minimized && (
                <Box className="floating-card-content">
                  {renderCardContent(card)}
                </Box>
              )}
            </Box>
          ))}

          {/* Left Fixed Column */}
          <div className="fixed-column left">
            <div className="column-header">
              <Dashboard className="column-icon" />
              <h3 className="column-title">CONTROL</h3>
            </div>
            <div className="column-content">
              {leftCardLogs.map((log) => (
                <div
                  key={log.id}
                  className={`column-item ${floatingCards.find(c => c.id === log.id)?.visible ? 'active' : ''}`}
                  onClick={() => toggleCard(log.id)}
                  title={log.description}
                >
                  <div className="column-item-icon">
                    {log.icon}
                  </div>
                  <div className="column-item-info">
                    <div className="column-item-title">{log.title}</div>
                    <div className="column-item-status">
                      <span className={`status-dot ${log.status}`}></span>
                      <span className="status-text">{log.status.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="column-item-action">
                    {floatingCards.find(c => c.id === log.id)?.visible ?
                      <ChevronLeft className="action-icon active" /> :
                      <ChevronRight className="action-icon" />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Fixed Column */}
          <div className="fixed-column right">
            <div className="column-header">
              <BarChart className="column-icon" />
              <h3 className="column-title">DATA</h3>
            </div>
            <div className="column-content">
              {rightCardLogs.map((log) => (
                <div
                  key={log.id}
                  className={`column-item ${floatingCards.find(c => c.id === log.id)?.visible ? 'active' : ''} ${log.id !== 'data-visualization' ? 'disabled' : ''}`}
                  onClick={() => log.id === 'data-visualization' ? toggleCard(log.id) : null}
                  title={log.description}
                >
                  <div className="column-item-icon">
                    {log.icon}
                  </div>
                  <div className="column-item-info">
                    <div className="column-item-title">{log.title}</div>
                    <div className="column-item-status">
                      <span className={`status-dot ${log.status}`}></span>
                      <span className="status-text">{log.status.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="column-item-action">
                    {log.id === 'data-visualization' ? (
                      floatingCards.find(c => c.id === log.id)?.visible ?
                        <ChevronLeft className="action-icon active" /> :
                        <ChevronRight className="action-icon" />
                    ) : (
                      <span className="action-icon disabled">•••</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default ADSDashboard;
