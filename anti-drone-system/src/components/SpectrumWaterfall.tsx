import React, { useEffect, useRef, useState } from "react";

interface SpectrumWaterfallProps {
  spectrumData: number[];
  width?: number;
  height?: number;
  minDb?: number;
  maxDb?: number;
}

const SpectrumWaterfall: React.FC<SpectrumWaterfallProps> = ({
  spectrumData,
  width = 800,
  height = 400,
  minDb = -100,
  maxDb = -20,
}) => {
  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  
  const [minFreq, setMinFreq] = useState(0);
  const [maxFreq, setMaxFreq] = useState(6000);
  const [minPower, setMinPower] = useState(-110);
  const [maxPower, setMaxPower] = useState(-10);
  const [colorScheme, setColorScheme] = useState("viridis");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  type ColorMap = (t: number) => [number, number, number];

  const colorMaps: Record<string, ColorMap> = {
    viridis: (t: number) => {
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const r = Math.round(255 * (t < 0.5 ? 0 : (t - 0.5) * 2));
      const g = Math.round(255 * (t < 0.25 ? t * 4 : t < 0.75 ? 1 : 1 - (t - 0.75) * 4));
      const b = Math.round(255 * (t < 0.5 ? 1 : 1 - (t - 0.5) * 2));
      return [r, g, b];
    },
    hot: (t: number) => {
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const r = Math.round(255 * Math.min(1, t * 2.5));
      const g = Math.round(255 * Math.max(0, Math.min(1, (t - 0.33) * 2.5)));
      const b = Math.round(255 * Math.max(0, Math.min(1, (t - 0.66) * 3)));
      return [r, g, b];
    },
    cool: (t: number) => {
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const r = Math.round(255 * t);
      const g = Math.round(255 * (1 - t));
      const b = 255;
      return [r, g, b];
    },
    grayscale: (t: number) => {
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const val = Math.round(255 * t);
      return [val, val, val];
    },
    jet: (t: number) => {
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const r = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 3))));
      const g = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 2))));
      const b = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 1))));
      return [r, g, b];
    }
  };

  const colorMap = colorMaps[colorScheme];

  useEffect(() => {
    if (!spectrumData || !waterfallRef.current) return;

    const canvas = waterfallRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    
    // Define margins for axes
    const marginLeft = 60;
    const marginRight = 20;
    const marginTop = 20;
    const marginBottom = 40;
    
    const plotWidth = w - marginLeft - marginRight;
    const plotHeight = h - marginTop - marginBottom;

    // Scroll the waterfall data down
    const old = ctx.getImageData(marginLeft, marginTop, plotWidth, plotHeight - 1);
    ctx.putImageData(old, marginLeft, marginTop + 1);

    // Create new row at the top
    const row = ctx.createImageData(plotWidth, 1);
    
    // Calculate frequency range mapping
    const totalFreqRange = 6000; // Assuming max possible frequency
    const startBin = Math.floor((minFreq / totalFreqRange) * spectrumData.length);
    const endBin = Math.floor((maxFreq / totalFreqRange) * spectrumData.length);
    const binRange = endBin - startBin;

    for (let x = 0; x < plotWidth; x++) {
      // Map pixel to frequency bin within selected range
      const bin = startBin + Math.floor((x / plotWidth) * binRange);
      const clampedBin = Math.max(0, Math.min(spectrumData.length - 1, bin));
      const value = spectrumData[clampedBin];

      let t = (value - minPower) / (maxPower - minPower);
      if (t < 0) t = 0;
      if (t > 1) t = 1;

      const [r, g, b] = colorMap(t);
      const idx = x * 4;

      row.data[idx] = r;
      row.data[idx + 1] = g;
      row.data[idx + 2] = b;
      row.data[idx + 3] = 255;
    }

    ctx.putImageData(row, marginLeft, marginTop);
    
    // Redraw axes and labels
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, marginLeft, h);
    ctx.fillRect(0, 0, w, marginTop);
    ctx.fillRect(0, marginTop + plotHeight, w, marginBottom);
    ctx.fillRect(marginLeft + plotWidth, 0, marginRight, h);
    
    // Draw border around plot area
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    ctx.strokeRect(marginLeft, marginTop, plotWidth, plotHeight);
    
    // Y-axis labels (time - most recent at top)
    ctx.fillStyle = "#aaa";
    ctx.font = "11px Arial";
    ctx.textAlign = "right";
    
    const timeSteps = 5;
    for (let i = 0; i <= timeSteps; i++) {
      const y = marginTop + (i / timeSteps) * plotHeight;
      const seconds = i * 2; // Approximate time in seconds
      ctx.fillText(seconds + "s", marginLeft - 8, y + 4);
    }
    
    // Y-axis title
    ctx.save();
    ctx.translate(15, marginTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#00ffcc";
    ctx.font = "12px Arial";
    ctx.fillText("Time", 0, 0);
    ctx.restore();
    
    // X-axis labels (frequency)
    ctx.textAlign = "center";
    const freqSteps = 10;
    for (let i = 0; i <= freqSteps; i++) {
      const x = marginLeft + (i / freqSteps) * plotWidth;
      const freq = minFreq + (maxFreq - minFreq) * (i / freqSteps);
      
      // Label
      ctx.fillStyle = "#aaa";
      ctx.fillText(freq.toFixed(0), x, marginTop + plotHeight + 20);
    }
    
    // X-axis title
    ctx.fillStyle = "#00ffcc";
    ctx.font = "12px Arial";
    ctx.fillText("Frequency (MHz)", marginLeft + plotWidth / 2, h - 5);
    
  }, [spectrumData, minPower, maxPower, minFreq, maxFreq, colorScheme, colorMap]);

  // Handle mouse wheel zoom
  useEffect(() => {
    const canvas = spectrumRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const range = maxFreq - minFreq;
      const center = (maxFreq + minFreq) / 2;
      const newRange = range * zoomFactor;
      
      setMinFreq(Math.max(0, center - newRange / 2));
      setMaxFreq(Math.min(6000, center + newRange / 2));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [minFreq, maxFreq]);

  // Handle mouse selection for zoom
  useEffect(() => {
    const canvas = spectrumRef.current;
    if (!canvas) return;

    const marginLeft = 60;
    const marginRight = 20;
    const plotWidth = canvas.width - marginLeft - marginRight;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      if (x >= marginLeft && x <= marginLeft + plotWidth) {
        setIsSelecting(true);
        setSelectionStart(x);
        setSelectionEnd(x);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      if (x >= marginLeft && x <= marginLeft + plotWidth) {
        setSelectionEnd(x);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelecting) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      if (selectionStart !== null && x !== selectionStart) {
        // Calculate frequency range from pixel positions
        const startPixel = Math.min(selectionStart, x) - marginLeft;
        const endPixel = Math.max(selectionStart, x) - marginLeft;
        
        const startFreq = minFreq + (startPixel / plotWidth) * (maxFreq - minFreq);
        const endFreq = minFreq + (endPixel / plotWidth) * (maxFreq - minFreq);
        
        setMinFreq(Math.max(0, startFreq));
        setMaxFreq(Math.min(6000, endFreq));
      }
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    const handleMouseLeave = () => {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isSelecting, selectionStart, minFreq, maxFreq]);

  useEffect(() => {
    if (!spectrumData || !spectrumRef.current) return;
    
    const canvas = spectrumRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    
    // Define margins for axes
    const marginLeft = 60;
    const marginRight = 20;
    const marginTop = 20;
    const marginBottom = 40;
    
    const plotWidth = w - marginLeft - marginRight;
    const plotHeight = h - marginTop - marginBottom;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    
    // Plot area background
    ctx.fillStyle = "rgba(20,20,20,1)";
    ctx.fillRect(marginLeft, marginTop, plotWidth, plotHeight);

    // Draw grid lines and labels
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.font = "11px Arial";
    ctx.fillStyle = "#aaa";
    ctx.textAlign = "right";

    // Horizontal grid lines (dBm) - Y axis
    const dbSteps = 8;
    for (let i = 0; i <= dbSteps; i++) {
      const db = minPower + (maxPower - minPower) * (i / dbSteps);
      const y = marginTop + plotHeight - (i / dbSteps) * plotHeight;
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotWidth, y);
      ctx.stroke();
      
      // Y-axis label
      ctx.fillText(db.toFixed(0), marginLeft - 8, y + 4);
    }
    
    // Y-axis title
    ctx.save();
    ctx.translate(15, marginTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#00ffcc";
    ctx.font = "12px Arial";
    ctx.fillText("Power (dBm)", 0, 0);
    ctx.restore();

    // Vertical grid lines (frequency) - X axis
    ctx.textAlign = "center";
    const freqSteps = 10;
    for (let i = 0; i <= freqSteps; i++) {
      const x = marginLeft + (i / freqSteps) * plotWidth;
      const freq = minFreq + (maxFreq - minFreq) * (i / freqSteps);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + plotHeight);
      ctx.stroke();
      
      // X-axis label
      ctx.fillStyle = "#aaa";
      ctx.fillText(freq.toFixed(0), x, marginTop + plotHeight + 20);
    }
    
    // X-axis title
    ctx.fillStyle = "#00ffcc";
    ctx.font = "12px Arial";
    ctx.fillText("Frequency (MHz)", marginLeft + plotWidth / 2, h - 5);

    // Draw spectrum line
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Clip to plot area
    ctx.save();
    ctx.rect(marginLeft, marginTop, plotWidth, plotHeight);
    ctx.clip();

    // Calculate frequency range mapping
    const totalFreqRange = 6000; // Assuming max possible frequency
    const startBin = Math.floor((minFreq / totalFreqRange) * spectrumData.length);
    const endBin = Math.floor((maxFreq / totalFreqRange) * spectrumData.length);
    const binRange = endBin - startBin;

    for (let i = 0; i <= plotWidth; i++) {
      // Map pixel to frequency bin within selected range
      const bin = startBin + Math.floor((i / plotWidth) * binRange);
      const clampedBin = Math.max(0, Math.min(spectrumData.length - 1, bin));
      
      let t = (spectrumData[clampedBin] - minPower) / (maxPower - minPower);
      t = Math.min(1, Math.max(0, t));

      const x = marginLeft + i;
      const y = marginTop + t * plotHeight;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.restore();

    // Draw selection overlay
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const startX = Math.min(selectionStart, selectionEnd);
      const endX = Math.max(selectionStart, selectionEnd);
      const selectionWidth = endX - startX;
      
      ctx.fillStyle = "rgba(0, 255, 204, 0.2)";
      ctx.fillRect(startX, marginTop, selectionWidth, plotHeight);
      
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, marginTop, selectionWidth, plotHeight);
    }
  }, [spectrumData, minPower, maxPower, minFreq, maxFreq, isSelecting, selectionStart, selectionEnd]);

  const spectrumHeight = Math.floor(height * 0.4);
  const waterfallHeight = height - spectrumHeight;

  return (
    <div style={{ width }}>
      {/* Control Panel */}
      <div style={{
        marginBottom: 20,
        padding: 15,
        background: "#1a1a1a",
        borderRadius: 8,
        border: "1px solid #333"
      }}>
        <div style={{ fontSize: 14, marginBottom: 15, color: "#00ffcc", fontWeight: "bold" }}>
          Controls
        </div>
        
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* X-Axis Zoom Controls */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
              X-Axis Zoom (Frequency)
            </label>
            <div style={{ display: "flex", gap: 5 }}>
              <button
                onClick={() => {
                  const range = maxFreq - minFreq;
                  const center = (maxFreq + minFreq) / 2;
                  const newRange = range * 0.7;
                  setMinFreq(Math.max(0, center - newRange / 2));
                  setMaxFreq(Math.min(6000, center + newRange / 2));
                }}
                style={{
                  padding: "5px 15px",
                  background: "#00ffcc",
                  color: "#000",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Zoom In
              </button>
              <button
                onClick={() => {
                  const range = maxFreq - minFreq;
                  const center = (maxFreq + minFreq) / 2;
                  const newRange = range * 1.3;
                  setMinFreq(Math.max(0, center - newRange / 2));
                  setMaxFreq(Math.min(6000, center + newRange / 2));
                }}
                style={{
                  padding: "5px 15px",
                  background: "#555",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Zoom Out
              </button>
              <button
                onClick={() => {
                  setMinFreq(0);
                  setMaxFreq(6000);
                }}
                style={{
                  padding: "5px 15px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Y-Axis Zoom Controls */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
              Y-Axis Zoom (Power)
            </label>
            <div style={{ display: "flex", gap: 5 }}>
              <button
                onClick={() => {
                  const range = maxPower - minPower;
                  const center = (maxPower + minPower) / 2;
                  const newRange = range * 0.7;
                  setMinPower(center - newRange / 2);
                  setMaxPower(center + newRange / 2);
                }}
                style={{
                  padding: "5px 15px",
                  background: "#00ffcc",
                  color: "#000",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Zoom In
              </button>
              <button
                onClick={() => {
                  const range = maxPower - minPower;
                  const center = (maxPower + minPower) / 2;
                  const newRange = range * 1.3;
                  setMinPower(center - newRange / 2);
                  setMaxPower(center + newRange / 2);
                }}
                style={{
                  padding: "5px 15px",
                  background: "#555",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Zoom Out
              </button>
              <button
                onClick={() => {
                  setMinPower(-110);
                  setMaxPower(-10);
                }}
                style={{
                  padding: "5px 15px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                Reset
              </button>
            </div>
          </div>
          {/* Color Scheme */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
              Color Scheme
            </label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              style={{
                padding: "5px 10px",
                background: "#000",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              <option value="viridis">Viridis (Blue-Green-Yellow)</option>
              <option value="hot">Hot (Black-Red-Yellow)</option>
              <option value="cool">Cool (Cyan-Magenta)</option>
              <option value="jet">Jet (Rainbow)</option>
              <option value="grayscale">Grayscale</option>
            </select>
          </div>

          {/* Min Frequency */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
              Min Frequency (MHz)
            </label>
            <input
              type="number"
              value={minFreq}
              onChange={(e) => setMinFreq(Number(e.target.value))}
              style={{
                padding: "5px 10px",
                background: "#000",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 4,
                width: 100
              }}
            />
          </div>

          {/* Max Frequency */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
              Max Frequency (MHz)
            </label>
            <input
              type="number"
              value={maxFreq}
              onChange={(e) => setMaxFreq(Number(e.target.value))}
              style={{
                padding: "5px 10px",
                background: "#000",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 4,
                width: 100
              }}
            />
          </div>

          {/* Min Power */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
              Min Power (dBm)
            </label>
            <input
              type="number"
              value={minPower}
              onChange={(e) => setMinPower(Number(e.target.value))}
              style={{
                padding: "5px 10px",
                background: "#000",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 4,
                width: 100
              }}
            />
          </div>

          {/* Max Power */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#aaa", marginBottom: 5 }}>
              Max Power (dBm)
            </label>
            <input
              type="number"
              value={maxPower}
              onChange={(e) => setMaxPower(Number(e.target.value))}
              style={{
                padding: "5px 10px",
                background: "#000",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 4,
                width: 100
              }}
            />
          </div>

        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <div style={{
          fontSize: 16,
          marginBottom: 10,
          color: "#00ffcc",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>Spectrum Analyzer</span>
          <span style={{ fontSize: 12, color: "#888", fontWeight: "normal",paddingRight:"50px"}}>
            Click and drag to zoom into a frequency range
          </span>
        </div>
        <canvas
          ref={spectrumRef}
          width={width}
          height={spectrumHeight}
          style={{ display: "block", background: "#000", cursor: "crosshair" }}
        />
      </div>

      <div>
        <div style={{ fontSize: 16, marginBottom: 10, color: "#00ffcc", fontWeight: "bold" }}>
          Waterfall Display
        </div>
        <canvas
          ref={waterfallRef}
          width={width}
          height={waterfallHeight}
          style={{ display: "block", background: "#000" }}
        />
      </div>
    </div>
  );
};

export default SpectrumWaterfall;