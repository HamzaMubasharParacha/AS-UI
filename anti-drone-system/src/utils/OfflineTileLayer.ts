import L from "leaflet";
import { offlineTileManager } from "./OfflineTileManager";

export interface OfflineTileLayerOptions extends L.TileLayerOptions {
  onlineUrl: string;
  offlineFirst?: boolean;
  showOfflineIndicator?: boolean;
}

export class OfflineTileLayer extends L.TileLayer {
  private onlineUrl: string;
  private offlineFirst: boolean;
  private showOfflineIndicator: boolean;
  private offlineTileUrls: Map<string, string> = new Map();

  constructor(options: OfflineTileLayerOptions) {
    // Initialize with a placeholder URL
    super("", options);

    this.onlineUrl = options.onlineUrl;
    this.offlineFirst = options.offlineFirst ?? true;
    this.showOfflineIndicator = options.showOfflineIndicator ?? true;
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement("img") as HTMLImageElement;

    L.DomEvent.on(
      tile,
      "load",
      L.Util.bind(this._tileOnLoad, this, done, tile)
    );
    L.DomEvent.on(
      tile,
      "error",
      L.Util.bind(this._tileOnError, this, done, tile)
    );

    if (this.options.crossOrigin || this.options.crossOrigin === "") {
      tile.crossOrigin =
        this.options.crossOrigin === true ? "" : this.options.crossOrigin;
    }

    tile.alt = "";
    tile.setAttribute("role", "presentation");

    // Try to load tile (offline first if enabled)
    this._loadTile(tile, coords);

    return tile;
  }

  private async _loadTile(
    tile: HTMLImageElement,
    coords: L.Coords
  ): Promise<void> {
    const tileKey = `${coords.z}/${coords.x}/${coords.y}`;

    try {
      if (this.offlineFirst) {
        // Try offline first
        const offlineUrl = await offlineTileManager.getOfflineTileUrl(
          coords.x,
          coords.y,
          coords.z
        );
        if (offlineUrl) {
          tile.src = offlineUrl;
          this._addOfflineIndicator(tile);
          return;
        }
      }

      // Fall back to online
      const onlineUrl = this._getOnlineTileUrl(coords);
      tile.src = onlineUrl;

      // Cache the tile for future offline use
      this._cacheOnlineTile(coords, onlineUrl);
    } catch (error) {
      console.error("Error loading tile:", error);
      // Try online as fallback
      tile.src = this._getOnlineTileUrl(coords);
    }
  }

  private _getOnlineTileUrl(coords: L.Coords): string {
    return this.onlineUrl
      .replace("{x}", coords.x.toString())
      .replace("{y}", coords.y.toString())
      .replace("{z}", coords.z.toString());
  }

  private async _cacheOnlineTile(coords: L.Coords, url: string): Promise<void> {
    try {
      // This will be handled by the browser's cache and our service worker
      // For now, we'll let the OfflineTileManager handle explicit caching
    } catch (error) {
      console.error("Error caching tile:", error);
    }
  }

  private _addOfflineIndicator(tile: HTMLImageElement): void {
    if (!this.showOfflineIndicator) return;

    // Add a small indicator that this tile is loaded from offline cache
    const indicator = document.createElement("div");
    indicator.style.position = "absolute";
    indicator.style.top = "2px";
    indicator.style.right = "2px";
    indicator.style.width = "8px";
    indicator.style.height = "8px";
    indicator.style.backgroundColor = "#00ff41";
    indicator.style.borderRadius = "50%";
    indicator.style.zIndex = "1000";
    indicator.style.pointerEvents = "none";
    indicator.title = "Offline tile";

    // Add indicator to tile's parent when tile is added to DOM
    const addIndicator = () => {
      if (tile.parentElement) {
        tile.parentElement.style.position = "relative";
        tile.parentElement.appendChild(indicator);
      }
    };

    // Wait for tile to be added to DOM
    setTimeout(addIndicator, 100);
  }

  // Override the getTileUrl method to handle our custom logic
  getTileUrl(coords: L.Coords): string {
    // This method is called by Leaflet, but we handle URL generation in _loadTile
    return this._getOnlineTileUrl(coords);
  }

  // Method to switch between online and offline modes
  setOfflineFirst(offlineFirst: boolean): void {
    this.offlineFirst = offlineFirst;
    this.redraw();
  }

  // Method to check if we're in offline mode
  isOfflineFirst(): boolean {
    return this.offlineFirst;
  }

  // Method to preload tiles for an area
  async preloadArea(
    bounds: L.LatLngBounds,
    minZoom: number,
    maxZoom: number,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const boundsObj = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    await offlineTileManager.downloadTilesForArea(
      boundsObj,
      minZoom,
      maxZoom,
      onProgress
    );
  }

  // Method to clear offline cache
  async clearOfflineCache(): Promise<void> {
    await offlineTileManager.clearAllTiles();
  }

  // Method to get cache statistics
  async getCacheStats() {
    return await offlineTileManager.getCacheStats();
  }
}

// Factory function to create offline tile layer
export function createOfflineTileLayer(
  options: OfflineTileLayerOptions
): OfflineTileLayer {
  return new OfflineTileLayer(options);
}

// ESRI Satellite offline tile layer
export function createESRISatelliteOfflineLayer(
  options: Partial<OfflineTileLayerOptions> = {}
): OfflineTileLayer {
  return new OfflineTileLayer({
    onlineUrl: "/NUST_TILES_2/{z}/{x}/{y}.png",
    // onlineUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    // attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    offlineFirst: true,
    showOfflineIndicator: true,
    ...options,
  });
}
