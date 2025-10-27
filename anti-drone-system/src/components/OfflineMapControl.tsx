import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CloudDownload,
  CloudOff,
  Delete,
  Info,
  Storage,
  Refresh,
  Cancel,
  GetApp,
  Publish,
  SaveAlt
} from '@mui/icons-material';
import { offlineTileManager } from '../utils/OfflineTileManager';
import { MapFileExporter } from '../utils/MapFileExporter';

interface OfflineMapControlProps {
  onOfflineModeChange?: (isOffline: boolean) => void;
  currentBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  currentZoom?: number;
}

interface CacheStats {
  totalTiles: number;
  cacheSize: number;
  oldestTile: number;
  newestTile: number;
}

const OfflineMapControl: React.FC<OfflineMapControlProps> = ({
  onOfflineModeChange,
  currentBounds,
  currentZoom = 13
}) => {
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [downloadCurrent, setDownloadCurrent] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(0);
  const [minZoom, setMinZoom] = useState(10);
  const [maxZoom, setMaxZoom] = useState(16);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cache stats on component mount
  useEffect(() => {
    loadCacheStats();
  }, []);

  // Monitor download progress
  useEffect(() => {
    if (isDownloading) {
      const interval = setInterval(() => {
        const progress = offlineTileManager.getDownloadProgress();
        setDownloadProgress(progress.progress);
        setDownloadCurrent(progress.current);
        setDownloadTotal(progress.total);
        setIsDownloading(progress.isDownloading);

        if (!progress.isDownloading && progress.total > 0) {
          // Download completed
          setAlertMessage(`Download completed! ${progress.total} tiles cached.`);
          setAlertSeverity('success');
          loadCacheStats();
          setTimeout(() => setAlertMessage(null), 5000);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isDownloading]);

  const loadCacheStats = async () => {
    try {
      const stats = await offlineTileManager.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  const handleOfflineModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const offline = event.target.checked;
    setIsOfflineMode(offline);
    if (onOfflineModeChange) {
      onOfflineModeChange(offline);
    }
  };

  const handleDownloadArea = async () => {
    if (!currentBounds) {
      setAlertMessage('No map area selected. Please navigate to the area you want to download.');
      setAlertSeverity('warning');
      setTimeout(() => setAlertMessage(null), 5000);
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadDialogOpen(false);

    try {
      await offlineTileManager.downloadTilesForArea(
        currentBounds,
        minZoom,
        maxZoom,
        (progress, current, total) => {
          setDownloadProgress(progress);
          setDownloadCurrent(current);
          setDownloadTotal(total);
        }
      );
    } catch (error) {
      console.error('Download error:', error);
      setAlertMessage(`Download failed: ${error}`);
      setAlertSeverity('error');
      setIsDownloading(false);
      setTimeout(() => setAlertMessage(null), 5000);
    }
  };

  const handleCancelDownload = () => {
    offlineTileManager.cancelDownload();
    setIsDownloading(false);
    setDownloadProgress(0);
    setAlertMessage('Download cancelled.');
    setAlertSeverity('info');
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleClearCache = async () => {
    try {
      await offlineTileManager.clearAllTiles();
      await loadCacheStats();
      setAlertMessage('Offline cache cleared successfully.');
      setAlertSeverity('success');
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      setAlertMessage('Failed to clear cache.');
      setAlertSeverity('error');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleClearExpired = async () => {
    try {
      const clearedCount = await offlineTileManager.clearExpiredTiles();
      await loadCacheStats();
      setAlertMessage(`Cleared ${clearedCount} expired tiles.`);
      setAlertSeverity('success');
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Error clearing expired tiles:', error);
      setAlertMessage('Failed to clear expired tiles.');
      setAlertSeverity('error');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const estimateTileCount = (): number => {
    if (!currentBounds) return 0;
    
    let totalTiles = 0;
    for (let z = minZoom; z <= maxZoom; z++) {
      const latRad1 = (currentBounds.north * Math.PI) / 180;
      const latRad2 = (currentBounds.south * Math.PI) / 180;
      const n = Math.pow(2, z);
      
      const x1 = Math.floor(((currentBounds.west + 180) / 360) * n);
      const x2 = Math.floor(((currentBounds.east + 180) / 360) * n);
      const y1 = Math.floor(((1 - Math.asinh(Math.tan(latRad1)) / Math.PI) / 2) * n);
      const y2 = Math.floor(((1 - Math.asinh(Math.tan(latRad2)) / Math.PI) / 2) * n);
      
      totalTiles += (Math.abs(x2 - x1) + 1) * (Math.abs(y2 - y1) + 1);
    }
    
    return totalTiles;
  };

  const handleExportMap = async () => {
    if (!currentBounds) {
      setAlertMessage('No map area selected. Please navigate to the area you want to export.');
      setAlertSeverity('warning');
      setTimeout(() => setAlertMessage(null), 5000);
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportOptions = {
        bounds: currentBounds,
        minZoom,
        maxZoom,
        format: 'json' as const,
        includeMetadata: true
      };

      const blob = await MapFileExporter.exportMapFile(
        exportOptions,
        (progress, current, total) => {
          setExportProgress(progress);
        }
      );

      const filename = `offline_map_${new Date().toISOString().split('T')[0]}.json`;
      MapFileExporter.downloadBlob(blob, filename);

      setAlertMessage(`Map exported successfully as ${filename}`);
      setAlertSeverity('success');
      setTimeout(() => setAlertMessage(null), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setAlertMessage(`Export failed: ${error}`);
      setAlertSeverity('error');
      setTimeout(() => setAlertMessage(null), 5000);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleImportMap = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      await MapFileExporter.importMapFile(
        file,
        (progress, current, total) => {
          setImportProgress(progress);
        }
      );

      await loadCacheStats();
      setAlertMessage(`Map imported successfully from ${file.name}`);
      setAlertSeverity('success');
      setTimeout(() => setAlertMessage(null), 5000);
    } catch (error) {
      console.error('Import error:', error);
      setAlertMessage(`Import failed: ${error}`);
      setAlertSeverity('error');
      setTimeout(() => setAlertMessage(null), 5000);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getExportSizeEstimate = () => {
    if (!currentBounds) return null;
    return MapFileExporter.estimateExportSize(currentBounds, minZoom, maxZoom);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#00ff41', fontWeight: 'bold' }}>
        📡 Offline Map Control
      </Typography>

      {alertMessage && (
        <Alert severity={alertSeverity} sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      )}

      {/* Offline Mode Toggle */}
      <Card sx={{ mb: 2, backgroundColor: 'rgba(0, 255, 65, 0.05)' }}>
        <CardContent>
          <FormControlLabel
            control={
              <Switch
                checked={isOfflineMode}
                onChange={handleOfflineModeToggle}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isOfflineMode ? <CloudOff /> : <CloudDownload />}
                <Typography>
                  {isOfflineMode ? 'Offline Mode' : 'Online Mode'}
                </Typography>
              </Box>
            }
          />
          <Typography variant="caption" display="block" sx={{ mt: 1, color: '#888' }}>
            {isOfflineMode 
              ? 'Using cached tiles when available, fallback to online'
              : 'Always load tiles from internet'
            }
          </Typography>
        </CardContent>
      </Card>

      {/* Download Progress */}
      {isDownloading && (
        <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Downloading Tiles...</Typography>
              <IconButton size="small" onClick={handleCancelDownload} color="error">
                <Cancel />
              </IconButton>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={downloadProgress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption">
              {downloadCurrent} / {downloadTotal} tiles ({downloadProgress.toFixed(1)}%)
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Export Progress */}
      {isExporting && (
        <Card sx={{ mb: 2, backgroundColor: 'rgba(0, 255, 65, 0.05)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Exporting Map...</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={exportProgress}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption">
              Export Progress: {exportProgress.toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {isImporting && (
        <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Importing Map...</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={importProgress}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption">
              Import Progress: {importProgress.toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <Card sx={{ mb: 2, backgroundColor: 'rgba(0, 255, 65, 0.05)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Storage />
              <Typography variant="subtitle2">Cache Statistics</Typography>
              <Tooltip title="Refresh statistics">
                <IconButton size="small" onClick={loadCacheStats}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Chip
                label={`${cacheStats.totalTiles} tiles`}
                size="small"
                color="primary"
              />
              <Chip
                label={`${cacheStats.cacheSize} MB`}
                size="small"
                color="secondary"
              />
            </Box>
            {cacheStats.oldestTile > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">
                  Oldest: {formatDate(cacheStats.oldestTile)}
                </Typography>
                <Typography variant="caption">
                  Newest: {formatDate(cacheStats.newestTile)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CloudDownload />}
          onClick={() => setDownloadDialogOpen(true)}
          disabled={isDownloading || !currentBounds}
        >
          Download Current Area
        </Button>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Export/Import Section */}
        <Typography variant="subtitle2" sx={{ color: '#00ff41', mb: 1 }}>
          Map File Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SaveAlt />}
            onClick={handleExportMap}
            disabled={isExporting || !currentBounds || !cacheStats || cacheStats.totalTiles === 0}
            size="small"
          >
            Export Map
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Publish />}
            onClick={handleImportMap}
            disabled={isImporting}
            size="small"
          >
            Import Map
          </Button>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleClearExpired}
            size="small"
          >
            Clear Expired
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Delete />}
            onClick={handleClearCache}
            color="error"
            size="small"
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".json,.zip,.mbtiles"
        style={{ display: 'none' }}
      />

      {/* Download Configuration Dialog */}
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)}>
        <DialogTitle>Download Map Tiles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Configure the zoom levels for offline map download.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Zoom Levels:</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Box>
                <Typography variant="caption">Min Zoom:</Typography>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={minZoom}
                  onChange={(e) => setMinZoom(parseInt(e.target.value))}
                  style={{ width: '60px', marginLeft: '8px' }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Max Zoom:</Typography>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={maxZoom}
                  onChange={(e) => setMaxZoom(parseInt(e.target.value))}
                  style={{ width: '60px', marginLeft: '8px' }}
                />
              </Box>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              Estimated tiles: ~{estimateTileCount().toLocaleString()}
              <br />
              Higher zoom levels significantly increase download size.
              {getExportSizeEstimate() && (
                <>
                  <br />
                  Export size estimate: ~{getExportSizeEstimate()?.estimatedSizeMB.toFixed(1)} MB
                </>
              )}
            </Typography>
          </Alert>

          <Alert severity="warning">
            <Typography variant="caption">
              This will download map tiles for the current visible area. 
              Large areas or high zoom levels may take considerable time and storage.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDownloadArea} variant="contained">
            Start Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfflineMapControl;