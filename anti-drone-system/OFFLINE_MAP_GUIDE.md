# Offline Map Implementation Guide

## Overview

This Anti-Drone System now includes comprehensive offline mapping capabilities that allow the system to function without internet connectivity. The implementation uses browser-based storage to cache map tiles locally.

## Features

### ✅ Implemented Features

1. **Offline Tile Storage**
   - Browser-based tile caching using IndexedDB
   - Automatic tile expiration and cleanup
   - Configurable cache size limits

2. **Tile Download Manager**
   - Download map tiles for specific areas
   - Progress tracking and cancellation
   - Zoom level configuration (1-18)

3. **Offline-First Map Layer**
   - Custom Leaflet tile layer with offline support
   - Automatic fallback to online tiles
   - Visual indicators for offline tiles

4. **Map Export/Import**
   - Export cached tiles as downloadable files
   - Import previously exported map data
   - JSON format support (ZIP and MBTiles planned)

5. **Interactive Control Panel**
   - Toggle between online/offline modes
   - Cache statistics and management
   - Real-time download progress

## Usage Instructions

### 1. Accessing Offline Controls

1. Open the Anti-Drone System application
2. Navigate to the map view
3. Look for the coordinates display panel (bottom-left)
4. Click "🔼 SHOW OFFLINE CONTROLS" to open the control panel

### 2. Downloading Map Tiles

1. Navigate to the area you want to cache
2. Open the offline controls panel
3. Click "Download Current Area"
4. Configure zoom levels:
   - **Min Zoom**: Lower detail level (recommended: 10-12)
   - **Max Zoom**: Higher detail level (recommended: 14-16)
   - **Warning**: Higher zoom levels significantly increase download size
5. Click "Start Download"
6. Monitor progress in the progress bar
7. Download can be cancelled at any time

### 3. Exporting Map Data

1. Ensure you have downloaded tiles for the desired area
2. Navigate to the area you want to export
3. Click "Export Map" in the offline controls
4. The system will create a downloadable JSON file
5. Save the file for backup or sharing

### 4. Importing Map Data

1. Click "Import Map" in the offline controls
2. Select a previously exported JSON file
3. Wait for the import process to complete
4. Imported tiles will be available for offline use

### 5. Cache Management

- **Clear Expired**: Removes tiles older than 7 days
- **Clear All**: Removes all cached tiles
- **Cache Stats**: Shows total tiles, storage size, and dates

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CesiumMap Component                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ OfflineTileLayer│  │    OfflineMapControl            │   │
│  │                 │  │                                 │   │
│  │ - Offline First │  │ - Download Manager              │   │
│  │ - Auto Fallback │  │ - Export/Import                 │   │
│  │ - Visual Hints  │  │ - Cache Management              │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │OfflineTileManager│  │    MapFileExporter              │   │
│  │                 │  │                                 │   │
│  │ - IndexedDB     │  │ - JSON Export                   │   │
│  │ - Tile Caching  │  │ - File Import                   │   │
│  │ - Expiration    │  │ - Size Estimation               │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      LocalForage                            │
│                    (IndexedDB Storage)                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. OfflineTileManager
- **File**: `src/utils/OfflineTileManager.ts`
- **Purpose**: Manages tile storage, download, and caching
- **Storage**: Uses LocalForage (IndexedDB) for persistent storage
- **Features**:
  - Tile coordinate calculation
  - Batch downloading with progress tracking
  - Cache size management and expiration
  - Statistics and cleanup utilities

#### 2. OfflineTileLayer
- **File**: `src/utils/OfflineTileLayer.ts`
- **Purpose**: Custom Leaflet tile layer with offline support
- **Features**:
  - Offline-first tile loading
  - Automatic fallback to online sources
  - Visual indicators for cached tiles
  - Preloading and cache management methods

#### 3. OfflineMapControl
- **File**: `src/components/OfflineMapControl.tsx`
- **Purpose**: User interface for offline map management
- **Features**:
  - Download configuration and progress
  - Export/import functionality
  - Cache statistics display
  - Mode switching (online/offline)

#### 4. MapFileExporter
- **File**: `src/utils/MapFileExporter.ts`
- **Purpose**: Handles map data export and import
- **Features**:
  - JSON format export/import
  - Size estimation
  - Progress tracking
  - File download utilities

### Storage Details

#### Tile Storage Structure
```javascript
// IndexedDB Structure
{
  storeName: 'tiles',
  keyPath: 'z/x/y', // e.g., "13/4567/2890"
  data: {
    blob: Blob,        // Actual tile image data
    timestamp: number, // Cache timestamp
    url: string       // Original tile URL
  }
}
```

#### Cache Configuration
```javascript
{
  maxZoom: 18,           // Maximum zoom level
  minZoom: 1,            // Minimum zoom level
  tileSize: 256,         // Tile size in pixels
  maxCacheSize: 500,     // Maximum cache size in MB
  cacheDuration: 604800000 // 7 days in milliseconds
}
```

## Performance Considerations

### Download Optimization
- **Batch Size**: Downloads are throttled with 50ms delays
- **Concurrent Requests**: Limited to prevent server overload
- **Progress Tracking**: Real-time progress updates
- **Cancellation**: Downloads can be stopped at any time

### Storage Efficiency
- **Compression**: Tiles stored as compressed blobs
- **Expiration**: Automatic cleanup of old tiles
- **Size Limits**: Configurable maximum cache size
- **Deduplication**: Prevents duplicate tile storage

### Memory Management
- **Lazy Loading**: Tiles loaded on-demand
- **URL Cleanup**: Blob URLs properly released
- **Cache Limits**: Browser storage limits respected

## Troubleshooting

### Common Issues

#### 1. Download Failures
**Symptoms**: Tiles fail to download or progress stops
**Solutions**:
- Check internet connectivity
- Reduce zoom level range
- Try smaller geographic areas
- Clear browser cache and retry

#### 2. Storage Quota Exceeded
**Symptoms**: "QuotaExceededError" in browser console
**Solutions**:
- Clear expired tiles
- Reduce cache size limit
- Clear all cached tiles
- Use lower zoom levels

#### 3. Import/Export Errors
**Symptoms**: Files fail to import or export
**Solutions**:
- Ensure file format is JSON
- Check file size limits
- Verify file integrity
- Try smaller datasets

#### 4. Performance Issues
**Symptoms**: Slow map loading or UI freezing
**Solutions**:
- Reduce concurrent downloads
- Clear browser cache
- Restart the application
- Use lower zoom levels

### Browser Compatibility

#### Supported Browsers
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

#### Storage Limits
- **Chrome**: ~60% of available disk space
- **Firefox**: ~50% of available disk space
- **Safari**: ~1GB per origin
- **Edge**: Similar to Chrome

## Future Enhancements

### Planned Features
1. **MBTiles Support**: Full SQLite-based tile storage
2. **ZIP Export**: Organized folder structure export
3. **Vector Tiles**: Support for vector-based maps
4. **Sync Capabilities**: Multi-device synchronization
5. **Compression**: Advanced tile compression algorithms

### Performance Improvements
1. **Service Worker**: Background tile downloading
2. **WebWorkers**: Parallel processing for large datasets
3. **Streaming**: Streaming export/import for large files
4. **Predictive Caching**: AI-based tile preloading

## API Reference

### OfflineTileManager Methods

```typescript
// Download tiles for an area
await offlineTileManager.downloadTilesForArea(
  bounds: { north, south, east, west },
  minZoom: number,
  maxZoom: number,
  onProgress?: (progress, current, total) => void
);

// Get cached tile
const tile = await offlineTileManager.getTileFromCache(x, y, z);

// Clear cache
await offlineTileManager.clearAllTiles();
await offlineTileManager.clearExpiredTiles();

// Get statistics
const stats = await offlineTileManager.getCacheStats();
```

### MapFileExporter Methods

```typescript
// Export map data
const blob = await MapFileExporter.exportMapFile(options, onProgress);

// Import map data
await MapFileExporter.importMapFile(file, onProgress);

// Download file
MapFileExporter.downloadBlob(blob, filename);

// Estimate export size
const estimate = MapFileExporter.estimateExportSize(bounds, minZoom, maxZoom);
```

## Configuration

### Environment Variables
```javascript
// Optional configuration in .env
REACT_APP_MAX_CACHE_SIZE=500        // MB
REACT_APP_CACHE_DURATION=604800000  // milliseconds
REACT_APP_MAX_ZOOM=18               // zoom level
REACT_APP_TILE_SERVER_URL=...       // custom tile server
```

### Runtime Configuration
```javascript
// Customize OfflineTileManager
const customManager = new OfflineTileManager({
  maxZoom: 16,
  minZoom: 8,
  maxCacheSize: 1000, // 1GB
  cacheDuration: 30 * 24 * 60 * 60 * 1000 // 30 days
});
```

## Security Considerations

### Data Privacy
- All tiles stored locally in browser
- No server-side storage of user data
- Export files contain only map imagery
- No personal or sensitive data cached

### Network Security
- HTTPS required for tile downloads
- CORS headers respected
- Rate limiting implemented
- No authentication data stored

## Support

For technical support or questions about the offline mapping functionality:

1. Check the browser console for error messages
2. Verify browser compatibility and storage availability
3. Test with smaller geographic areas first
4. Clear cache and restart if issues persist

## License

This offline mapping implementation is part of the Anti-Drone System and follows the same licensing terms as the main project.