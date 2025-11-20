import localforage from "localforage";

export interface TileInfo {
  x: number;
  y: number;
  z: number;
  url: string;
  blob?: Blob;
  timestamp: number;
}

export interface OfflineTileManagerConfig {
  maxZoom: number;
  minZoom: number;
  tileSize: number;
  maxCacheSize: number; // in MB
  cacheDuration: number; // in milliseconds
}

export class OfflineTileManager {
  private config: OfflineTileManagerConfig;
  private tileStore: LocalForage;
  private metadataStore: LocalForage;
  private downloadQueue: TileInfo[] = [];
  private isDownloading = false;
  private downloadProgress = 0;
  private totalTiles = 0;

  constructor(config: Partial<OfflineTileManagerConfig> = {}) {
    this.config = {
      maxZoom: 18,
      minZoom: 1,
      tileSize: 256,
      maxCacheSize: 500, // 500MB
      cacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...config,
    };

    // Initialize storage
    this.tileStore = localforage.createInstance({
      name: "OfflineMapTiles",
      storeName: "tiles",
    });

    this.metadataStore = localforage.createInstance({
      name: "OfflineMapTiles",
      storeName: "metadata",
    });
  }

  /**
   * Generate tile coordinates for a given bounding box and zoom levels
   */
  private generateTileCoordinates(
    bounds: { north: number; south: number; east: number; west: number },
    minZoom: number,
    maxZoom: number
  ): TileInfo[] {
    const tiles: TileInfo[] = [];

    for (let z = minZoom; z <= maxZoom; z++) {
      const northWestTile = this.latLngToTile(bounds.north, bounds.west, z);
      const southEastTile = this.latLngToTile(bounds.south, bounds.east, z);

      for (let x = northWestTile.x; x <= southEastTile.x; x++) {
        for (let y = northWestTile.y; y <= southEastTile.y; y++) {
          tiles.push({
            x,
            y,
            z,
            url: this.getTileUrl(x, y, z),
            timestamp: Date.now(),
          });
        }
      }
    }

    return tiles;
  }

  /**
   * Convert latitude/longitude to tile coordinates
   */
  private latLngToTile(
    lat: number,
    lng: number,
    zoom: number
  ): { x: number; y: number } {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
    );
    return { x, y };
  }

  /**
   * Generate tile URL for ESRI satellite imagery
   */
  private getTileUrl(x: number, y: number, z: number): string {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  }

  /**
   * Download tiles for offline use
   */
  async downloadTilesForArea(
    bounds: { north: number; south: number; east: number; west: number },
    minZoom: number = this.config.minZoom,
    maxZoom: number = this.config.maxZoom,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<void> {
    if (this.isDownloading) {
      throw new Error("Download already in progress");
    }

    const tiles = this.generateTileCoordinates(bounds, minZoom, maxZoom);
    this.downloadQueue = tiles;
    this.totalTiles = tiles.length;
    this.downloadProgress = 0;
    this.isDownloading = true;

    console.log(`Starting download of ${this.totalTiles} tiles`);

    try {
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];

        // Check if tile already exists and is not expired
        const existingTile = await this.getTileFromCache(
          tile.x,
          tile.y,
          tile.z
        );
        if (existingTile && !this.isTileExpired(existingTile)) {
          this.downloadProgress++;
          if (onProgress) {
            onProgress(
              (this.downloadProgress / this.totalTiles) * 100,
              this.downloadProgress,
              this.totalTiles
            );
          }
          continue;
        }

        try {
          const response = await fetch(tile.url);
          if (response.ok) {
            const blob = await response.blob();
            tile.blob = blob;
            await this.saveTileToCache(tile);

            this.downloadProgress++;
            if (onProgress) {
              onProgress(
                (this.downloadProgress / this.totalTiles) * 100,
                this.downloadProgress,
                this.totalTiles
              );
            }
          }
        } catch (error) {
          console.error(
            `Failed to download tile ${tile.x}/${tile.y}/${tile.z}:`,
            error
          );
        }

        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Update metadata
      await this.updateCacheMetadata();
      console.log("Tile download completed");
    } finally {
      this.isDownloading = false;
      this.downloadQueue = [];
    }
  }

  /**
   * Save tile to cache
   */
  async saveTileToCache(tile: TileInfo): Promise<void> {
    const key = `${tile.z}/${tile.x}/${tile.y}`;
    const tileData = {
      blob: tile.blob,
      timestamp: tile.timestamp,
      url: tile.url,
    };
    await this.tileStore.setItem(key, tileData);
  }

  /**
   * Get tile from cache
   */
  async getTileFromCache(
    x: number,
    y: number,
    z: number
  ): Promise<TileInfo | null> {
    const key = `${z}/${x}/${y}`;
    try {
      const tileData = (await this.tileStore.getItem(key)) as any;
      if (tileData) {
        return {
          x,
          y,
          z,
          url: tileData.url,
          blob: tileData.blob,
          timestamp: tileData.timestamp,
        };
      }
    } catch (error) {
      console.error("Error retrieving tile from cache:", error);
    }
    return null;
  }

  /**
   * Check if tile is expired
   */
  private isTileExpired(tile: TileInfo): boolean {
    return Date.now() - tile.timestamp > this.config.cacheDuration;
  }

  /**
   * Get offline tile URL for Leaflet
   */
  async getOfflineTileUrl(
    x: number,
    y: number,
    z: number
  ): Promise<string | null> {
    const tile = await this.getTileFromCache(x, y, z);
    if (tile && tile.blob) {
      return URL.createObjectURL(tile.blob);
    }
    return null;
  }

  /**
   * Check if area is available offline
   */
  async isAreaAvailableOffline(
    bounds: { north: number; south: number; east: number; west: number },
    zoom: number
  ): Promise<boolean> {
    const tiles = this.generateTileCoordinates(bounds, zoom, zoom);

    for (const tile of tiles) {
      const cachedTile = await this.getTileFromCache(tile.x, tile.y, tile.z);
      if (!cachedTile || this.isTileExpired(cachedTile)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalTiles: number;
    cacheSize: number;
    oldestTile: number;
    newestTile: number;
  }> {
    const keys = await this.tileStore.keys();
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    for (const key of keys) {
      try {
        const tileData = (await this.tileStore.getItem(key)) as any;
        if (tileData && tileData.blob) {
          totalSize += tileData.blob.size;
          if (tileData.timestamp < oldestTimestamp) {
            oldestTimestamp = tileData.timestamp;
          }
          if (tileData.timestamp > newestTimestamp) {
            newestTimestamp = tileData.timestamp;
          }
        }
      } catch (error) {
        console.error("Error reading tile data:", error);
      }
    }

    return {
      totalTiles: keys.length,
      cacheSize: Math.round(totalSize / (1024 * 1024)), // MB
      oldestTile: oldestTimestamp,
      newestTile: newestTimestamp,
    };
  }

  /**
   * Clear expired tiles
   */
  async clearExpiredTiles(): Promise<number> {
    const keys = await this.tileStore.keys();
    let clearedCount = 0;

    for (const key of keys) {
      try {
        const tileData = (await this.tileStore.getItem(key)) as any;
        if (
          tileData &&
          this.isTileExpired({ timestamp: tileData.timestamp } as TileInfo)
        ) {
          await this.tileStore.removeItem(key);
          clearedCount++;
        }
      } catch (error) {
        console.error("Error clearing expired tile:", error);
      }
    }

    await this.updateCacheMetadata();
    return clearedCount;
  }

  /**
   * Clear all cached tiles
   */
  async clearAllTiles(): Promise<void> {
    await this.tileStore.clear();
    await this.metadataStore.clear();
  }

  /**
   * Update cache metadata
   */
  private async updateCacheMetadata(): Promise<void> {
    const stats = await this.getCacheStats();
    await this.metadataStore.setItem("stats", {
      ...stats,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Get download progress
   */
  getDownloadProgress(): {
    progress: number;
    current: number;
    total: number;
    isDownloading: boolean;
  } {
    return {
      progress:
        this.totalTiles > 0
          ? (this.downloadProgress / this.totalTiles) * 100
          : 0,
      current: this.downloadProgress,
      total: this.totalTiles,
      isDownloading: this.isDownloading,
    };
  }

  /**
   * Cancel ongoing download
   */
  cancelDownload(): void {
    this.isDownloading = false;
    this.downloadQueue = [];
  }
}

// Singleton instance
export const offlineTileManager = new OfflineTileManager();
