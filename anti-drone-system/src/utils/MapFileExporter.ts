import { offlineTileManager } from './OfflineTileManager';

export interface MapExportOptions {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  minZoom: number;
  maxZoom: number;
  format: 'mbtiles' | 'zip' | 'json';
  includeMetadata?: boolean;
}

export interface ExportedMapData {
  metadata: {
    name: string;
    bounds: MapExportOptions['bounds'];
    minZoom: number;
    maxZoom: number;
    tileCount: number;
    exportDate: string;
    format: string;
    version: string;
  };
  tiles: Array<{
    x: number;
    y: number;
    z: number;
    data: string; // base64 encoded tile data
  }>;
}

export class MapFileExporter {
  /**
   * Export cached map tiles to a downloadable file
   */
  static async exportMapFile(
    options: MapExportOptions,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<Blob> {
    const { bounds, minZoom, maxZoom, format, includeMetadata = true } = options;

    // Generate tile coordinates for the specified area
    const tileCoordinates = this.generateTileCoordinates(bounds, minZoom, maxZoom);
    const totalTiles = tileCoordinates.length;
    let processedTiles = 0;

    const exportData: ExportedMapData = {
      metadata: {
        name: `offline_map_${Date.now()}`,
        bounds,
        minZoom,
        maxZoom,
        tileCount: totalTiles,
        exportDate: new Date().toISOString(),
        format,
        version: '1.0.0'
      },
      tiles: []
    };

    // Process each tile
    for (const coord of tileCoordinates) {
      try {
        const tile = await offlineTileManager.getTileFromCache(coord.x, coord.y, coord.z);
        if (tile && tile.blob) {
          const base64Data = await this.blobToBase64(tile.blob);
          exportData.tiles.push({
            x: coord.x,
            y: coord.y,
            z: coord.z,
            data: base64Data
          });
        }
        
        processedTiles++;
        if (onProgress) {
          onProgress((processedTiles / totalTiles) * 100, processedTiles, totalTiles);
        }
      } catch (error) {
        console.error(`Error processing tile ${coord.z}/${coord.x}/${coord.y}:`, error);
      }
    }

    // Create the export file based on format
    switch (format) {
      case 'json':
        return this.createJSONExport(exportData);
      case 'zip':
        return this.createZIPExport(exportData);
      case 'mbtiles':
        return this.createMBTilesExport(exportData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import map tiles from a file
   */
  static async importMapFile(
    file: File,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<void> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'json':
        return this.importJSONFile(file, onProgress);
      case 'zip':
        return this.importZIPFile(file, onProgress);
      case 'mbtiles':
        return this.importMBTilesFile(file, onProgress);
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  }

  /**
   * Generate tile coordinates for a bounding box
   */
  private static generateTileCoordinates(
    bounds: MapExportOptions['bounds'],
    minZoom: number,
    maxZoom: number
  ): Array<{ x: number; y: number; z: number }> {
    const tiles: Array<{ x: number; y: number; z: number }> = [];

    for (let z = minZoom; z <= maxZoom; z++) {
      const northWestTile = this.latLngToTile(bounds.north, bounds.west, z);
      const southEastTile = this.latLngToTile(bounds.south, bounds.east, z);

      for (let x = northWestTile.x; x <= southEastTile.x; x++) {
        for (let y = northWestTile.y; y <= southEastTile.y; y++) {
          tiles.push({ x, y, z });
        }
      }
    }

    return tiles;
  }

  /**
   * Convert latitude/longitude to tile coordinates
   */
  private static latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
    return { x, y };
  }

  /**
   * Convert blob to base64 string
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 string to blob
   */
  private static base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Create JSON export
   */
  private static createJSONExport(data: ExportedMapData): Blob {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Create ZIP export (simplified - would need JSZip library for full implementation)
   */
  private static createZIPExport(data: ExportedMapData): Blob {
    // For now, create a JSON file. In a full implementation, you'd use JSZip
    // to create individual tile files in a folder structure
    console.warn('ZIP export not fully implemented. Creating JSON export instead.');
    return this.createJSONExport(data);
  }

  /**
   * Create MBTiles export (simplified - would need SQL.js for full implementation)
   */
  private static createMBTilesExport(data: ExportedMapData): Blob {
    // For now, create a JSON file. In a full implementation, you'd create
    // an SQLite database following the MBTiles specification
    console.warn('MBTiles export not fully implemented. Creating JSON export instead.');
    return this.createJSONExport(data);
  }

  /**
   * Import JSON file
   */
  private static async importJSONFile(
    file: File,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<void> {
    const text = await file.text();
    const data: ExportedMapData = JSON.parse(text);
    
    const totalTiles = data.tiles.length;
    let importedTiles = 0;

    for (const tileData of data.tiles) {
      try {
        const blob = this.base64ToBlob(tileData.data);
        const tile = {
          x: tileData.x,
          y: tileData.y,
          z: tileData.z,
          url: `imported_tile_${tileData.z}_${tileData.x}_${tileData.y}`,
          blob,
          timestamp: Date.now()
        };

        // Save to offline tile manager
        await offlineTileManager.saveTileToCache(tile);
        
        importedTiles++;
        if (onProgress) {
          onProgress((importedTiles / totalTiles) * 100, importedTiles, totalTiles);
        }
      } catch (error) {
        console.error(`Error importing tile ${tileData.z}/${tileData.x}/${tileData.y}:`, error);
      }
    }

    console.log(`Successfully imported ${importedTiles} tiles`);
  }

  /**
   * Import ZIP file (placeholder)
   */
  private static async importZIPFile(
    file: File,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<void> {
    throw new Error('ZIP import not implemented. Please use JSON format.');
  }

  /**
   * Import MBTiles file (placeholder)
   */
  private static async importMBTilesFile(
    file: File,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<void> {
    throw new Error('MBTiles import not implemented. Please use JSON format.');
  }

  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get file size estimate for export
   */
  static estimateExportSize(
    bounds: MapExportOptions['bounds'],
    minZoom: number,
    maxZoom: number
  ): { tileCount: number; estimatedSizeMB: number } {
    const tileCoordinates = this.generateTileCoordinates(bounds, minZoom, maxZoom);
    const tileCount = tileCoordinates.length;
    
    // Estimate average tile size (satellite imagery is typically 15-30KB per tile)
    const averageTileSizeKB = 20;
    const estimatedSizeMB = (tileCount * averageTileSizeKB) / 1024;
    
    return { tileCount, estimatedSizeMB };
  }
}
