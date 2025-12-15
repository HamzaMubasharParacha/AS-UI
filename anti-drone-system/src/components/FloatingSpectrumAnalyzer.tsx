import React, { useEffect, useRef, useState, useCallback } from "react";
 
interface FloatingSpectrumAnalyzerProps {
  spectrumData: number[];
  width?: number;
  height?: number;
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
  settings?: {
    minFreq: number;
    maxFreq: number;
    minPower: number;
    maxPower: number;
    colorScheme: string;
  };
 
}
 
const FloatingSpectrumAnalyzer: React.FC<FloatingSpectrumAnalyzerProps> = ({
  spectrumData,
  width = 400,
  height = 250,
  onClose,
  initialPosition = { x: 100, y: 100 },
  settings,
}) => {
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
 
  // Dragging state
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
 
  // Spectrum settings
  const [minFreq, setMinFreq] = useState(settings?.minFreq || 0);
  const [maxFreq, setMaxFreq] = useState(settings?.maxFreq || 6000);
  const [minPower, setMinPower] = useState(settings?.minPower || -110);
  const [maxPower, setMaxPower] = useState(settings?.maxPower || -10);
 
 
  // Handle drag start for window movement
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag if clicking on the header
    if (!(e.target as HTMLElement).closest('.floating-spectrum-header')) return;
   
    e.preventDefault();
    e.stopPropagation();
   
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }
  }, []);
 
  // Handle drag movement for window
  useEffect(() => {
    if (!isDragging) return;
 
    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - width - 10, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - height - 10, e.clientY - dragOffset.y));
     
      setPosition({ x: newX, y: newY });
    };
 
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
 
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
 
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, width, height]);
 
  // Draw spectrum
  useEffect(() => {
    if (!spectrumRef.current) {
      return;
    }
   
    const canvas = spectrumRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
 
 
    const w = canvas.width;
    const h = canvas.height;
   
    // Define margins for axes
    const marginLeft = 40;
    const marginRight = 10;
    const marginTop = 15;
    const marginBottom = 25;
   
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
    ctx.font = "9px Arial";
    ctx.fillStyle = "#aaa";
 
    // Horizontal grid lines (dBm)
    const dbSteps = 5;
    for (let i = 0; i <= dbSteps; i++) {
      const db = minPower + (maxPower - minPower) * (i / dbSteps);
      const y = marginTop + plotHeight - (i / dbSteps) * plotHeight;
     
      // Grid line
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotWidth, y);
      ctx.stroke();
     
      // Y-axis label
      ctx.textAlign = "right";
      ctx.fillText(db.toFixed(0), marginLeft - 5, y + 3);
    }
   
    // Vertical grid lines (frequency)
    ctx.textAlign = "center";
    const freqSteps = 5;
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
      ctx.fillText(freq.toFixed(0), x, marginTop + plotHeight + 15);
    }
 
    // Draw spectrum line
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 2;
    ctx.beginPath();
   
    // Clip to plot area
    ctx.save();
    ctx.rect(marginLeft, marginTop, plotWidth, plotHeight);
    ctx.clip();
 
    // Use spectrum data if available, otherwise draw a dummy line
    if (spectrumData.length > 0) {
      // Calculate frequency range mapping
      const totalFreqRange = 6000;
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
    } else {
      // Draw a dummy sine wave
      for (let i = 0; i <= plotWidth; i++) {
        const x = marginLeft + i;
        const y = marginTop + plotHeight/2 + Math.sin(i/20) * plotHeight/3;
       
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
 
    ctx.stroke();
    ctx.restore();
 
    // Draw axes titles
    ctx.fillStyle = "#00ffcc";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Frequency (MHz)", marginLeft + plotWidth / 2, h - 5);
   
    // Y-axis title
    ctx.save();
    ctx.translate(10, marginTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Power (dBm)", 0, 0);
    ctx.restore();
 
  }, [spectrumData, minPower, maxPower, minFreq, maxFreq, width, height]);
 
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
 
  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: width,
        zIndex: 9999,
        cursor: isDragging ? "grabbing" : "default",
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden",
        border: "2px solid var(--primary-color)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.7)",
        userSelect: "none",
      }}
    >
      {/* Drag handle header */}
      <div
        className="floating-spectrum-header"
        onMouseDown={handleMouseDown}
        style={{
          padding: "8px 10px",
          background: "linear-gradient(90deg, #1a1a1a 0%, #0a0a0a 100%)",
          borderBottom: "2px solid var(--primary-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "grab",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--primary-color)", fontWeight: "bold", fontFamily: '"Roboto Mono", monospace' }}>
          📡 FLOATING SPECTRUM
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#ff4444",
              cursor: "pointer",
              fontSize: "16px",
              padding: "0",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "3px",
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 68, 68, 0.1)"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ✕
          </button>
        )}
      </div>
 
      {/* Spectrum display */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={spectrumRef}
          width={width}
          height={height}
          style={{
            display: 'block',
            background: '#000',
            cursor: 'crosshair'
          }}
        />
       
       
      </div>
 
      {/* Quick controls */}
      <div
        style={{
          padding: "8px 10px",
          background: "rgba(10, 10, 10, 0.95)",
          borderTop: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <button
          onClick={() => {
            const range = maxFreq - minFreq;
            const center = (maxFreq + minFreq) / 2;
            const newRange = range * 0.7;
            setMinFreq(Math.max(0, center - newRange / 2));
            setMaxFreq(Math.min(6000, center + newRange / 2));
          }}
          style={{
            padding: "4px 10px",
            background: "var(--primary-color)",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: "bold",
            fontFamily: '"Roboto Mono", monospace',
            flex: 1,
          }}
        >
          ZOOM IN
        </button>
       
        <button
          onClick={() => {
            setMinFreq(0);
            setMaxFreq(6000);
          }}
          style={{
            padding: "4px 10px",
            background: "#222",
            color: "var(--primary-color)",
            border: "1px solid var(--primary-color)",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: '"Roboto Mono", monospace',
            flex: 1,
          }}
        >
          RESET
        </button>
      </div>
    </div>
  );
};
 
export default FloatingSpectrumAnalyzer;
 