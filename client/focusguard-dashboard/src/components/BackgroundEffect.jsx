// src/components/BackgroundEffect.jsx
import React, { useEffect, useRef, useState } from "react";

export default function BackgroundEffect() {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);

  // State for theme and density
  const [theme, setTheme] = useState(0);
  const [density, setDensity] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Neural Network data
  const networkRef = useRef({
    nodes: [],
    connections: [],
    angleX: 0,
    angleY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  // Themes gradients
  const themes = [
    ["#4F46E5", "#7C3AED", "#C026D3", "#DB2777"],
    ["#F59E0B", "#F97316", "#DC2626", "#7F1D1D"],
    ["#EC4899", "#8B5CF6", "#6366F1", "#3B82F6"],
    ["#10B981", "#A3E635", "#FACC15", "#FB923C"],
  ];

  // Utility: linear interpolation
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Generate nodes based on density and formation
  function generateNodes(densityPercent) {
    const count = Math.floor((densityPercent / 100) * 150); // max 150 nodes
    const nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.005 + Math.random() * 0.01,
        energy: 0,
      });
    }
    return nodes;
  }

  // Calculate distance between nodes
  function distance(a, b) {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
        (a.y - b.y) ** 2 +
        (a.z - b.z) ** 2
    );
  }

  // Initialize network nodes & connections
  function initNetwork(densityPercent) {
    const nodes = generateNodes(densityPercent);
    const connections = [];

    // Connect nodes that are close enough
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (distance(nodes[i], nodes[j]) < 0.3) {
          connections.push({ from: i, to: j });
        }
      }
    }
    return { nodes, connections };
  }

  // 3D rotation helpers
  function rotateX(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x,
      y: point.y * cos - point.z * sin,
      z: point.y * sin + point.z * cos,
    };
  }
  function rotateY(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos + point.z * sin,
      y: point.y,
      z: -point.x * sin + point.z * cos,
    };
  }

  // Project 3D point to 2D canvas coords
  function project(point, width, height) {
    const distance = 2;
    const z = point.z + distance;
    const scale = 0.8 * (distance / z);
    return {
      x: width / 2 + point.x * scale * width,
      y: height / 2 + point.y * scale * height,
      scale,
    };
  }

  // Animate the neural network
  function animate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { nodes, connections, angleX, angleY } = networkRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background: black with slight transparency for glow effect
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Colors for current theme (use gradient stops)
    const colors = themes[theme];

    // Update angles slowly for auto rotation if not dragging
    if (!networkRef.current.isDragging) {
      networkRef.current.angleX += 0.002;
      networkRef.current.angleY += 0.003;
    }

    // Rotate and project nodes
    const projected = nodes.map((node) => {
      let p = rotateX(node, networkRef.current.angleX);
      p = rotateY(p, networkRef.current.angleY);
      return project(p, canvas.width, canvas.height);
    });

    // Draw connections
    ctx.lineCap = "round";
    connections.forEach(({ from, to }) => {
      const a = projected[from];
      const b = projected[to];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 200) {
        const alpha = lerp(0.2, 0.8, 1 - dist / 200);
        ctx.strokeStyle = `rgba(255, 120, 50, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    projected.forEach(({ x, y, scale }, i) => {
      const node = nodes[i];
      const radius = node.radius * canvas.width * scale;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(255, 140, 50, 1)");
      gradient.addColorStop(1, "rgba(255, 140, 50, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    animationIdRef.current = requestAnimationFrame(animate);
  }

  // Handle user interaction: rotate on drag
  function onPointerDown(e) {
    networkRef.current.isDragging = true;
    networkRef.current.lastX = e.clientX;
    networkRef.current.lastY = e.clientY;
  }

  function onPointerMove(e) {
    if (!networkRef.current.isDragging) return;
    const dx = e.clientX - networkRef.current.lastX;
    const dy = e.clientY - networkRef.current.lastY;
    networkRef.current.angleY += dx * 0.005;
    networkRef.current.angleX += dy * 0.005;
    networkRef.current.lastX = e.clientX;
    networkRef.current.lastY = e.clientY;
  }

  function onPointerUp() {
    networkRef.current.isDragging = false;
  }

  // Handle theme button clicks
  function onThemeChange(i) {
    setTheme(i);
  }

  // Handle density slider change
  function onDensityChange(e) {
    setDensity(Number(e.target.value));
  }

  // Pause/play button
  function togglePause() {
    setIsPaused((p) => !p);
  }

  // Reset camera button
  function resetCamera() {
    networkRef.current.angleX = 0;
    networkRef.current.angleY = 0;
  }

  // Change formation button - just regenerate nodes with current density for now
  function changeFormation() {
    const { nodes, connections } = initNetwork(density);
    networkRef.current.nodes = nodes;
    networkRef.current.connections = connections;
  }

  // Setup on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize network data
    const { nodes, connections } = initNetwork(density);
    networkRef.current.nodes = nodes;
    networkRef.current.connections = connections;
    networkRef.current.angleX = 0;
    networkRef.current.angleY = 0;

    // Start animation loop
    if (!isPaused) {
      animationIdRef.current = requestAnimationFrame(animate);
    }

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  // Update on theme or pause state change
  useEffect(() => {
    if (isPaused) {
      cancelAnimationFrame(animationIdRef.current);
    } else {
      animationIdRef.current = requestAnimationFrame(animate);
    }
  }, [isPaused, theme]);

  // Update nodes & connections when density changes
  useEffect(() => {
    const { nodes, connections } = initNetwork(density);
    networkRef.current.nodes = nodes;
    networkRef.current.connections = connections;
  }, [density]);

  // Window resize handler
  useEffect(() => {
    function onResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {/* Load Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
        rel="stylesheet"
      />

      {/* Inline styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0; padding: 0; box-sizing: border-box;
            }
            canvas#neural-network-canvas {
              display: block;
              width: 100%;
              height: 100%;
              cursor: pointer;
              position: fixed;
              top: 0; left: 0;
              z-index: 1;
            }
            .ui-panel {
              position: fixed;
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              background: rgba(0, 0, 0, 0.7);
              border-radius: 12px;
              border: 1px solid rgba(255, 120, 50, 0.3);
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
              z-index: 10;
              padding: 15px;
              color: #eee;
              font-family: 'Inter', sans-serif;
              user-select: none;
            }
            #instructions-container {
              top: 20px;
              left: 20px;
              font-size: 14px;
              line-height: 1.5;
              max-width: 280px;
            }
            #instruction-title {
              font-weight: 600;
              margin-bottom: 6px;
              font-size: 15px;
            }
            #theme-selector {
              top: 20px;
              right: 20px;
              display: flex;
              flex-direction: column;
              gap: 12px;
              max-width: 150px;
            }
            #theme-selector-title {
              font-weight: 600;
              font-size: 15px;
              margin-bottom: 2px;
            }
            .theme-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .theme-button {
              width: 36px;
              height: 36px;
              border-radius: 8px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              cursor: pointer;
              transition: transform 0.2s, border-color 0.2s;
              outline: none;
              overflow: hidden;
              background-clip: padding-box;
            }
            .theme-button:hover, .theme-button:focus {
              transform: scale(1.05);
              border-color: rgba(255, 255, 255, 0.7);
            }
            .theme-button.active {
              transform: scale(1.05);
              border-color: rgba(255, 255, 255, 0.9);
              box-shadow: 0 0 10px rgba(255, 200, 150, 0.6);
            }
            #theme-1 { background: linear-gradient(45deg, #4F46E5, #7C3AED, #C026D3, #DB2777); }
            #theme-2 { background: linear-gradient(45deg, #F59E0B, #F97316, #DC2626, #7F1D1D); }
            #theme-3 { background: linear-gradient(45deg, #EC4899, #8B5CF6, #6366F1, #3B82F6); }
            #theme-4 { background: linear-gradient(45deg, #10B981, #A3E635, #FACC15, #FB923C); }
            #density-controls {
              margin-top: 8px;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .density-label {
              font-size: 13px;
              display: flex;
              justify-content: space-between;
            }
            .density-slider {
              width: 100%;
              appearance: none;
              height: 4px;
              border-radius: 2px;
              background: rgba(255, 120, 50, 0.3);
              outline: none;
              cursor: pointer;
            }
            .density-slider::-webkit-slider-thumb {
              appearance: none;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: rgba(255, 120, 50, 0.8);
              cursor: pointer;
              transition: transform 0.1s, background 0.1s;
            }
            .density-slider::-moz-range-thumb {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: rgba(255, 120, 50, 0.8);
              cursor: pointer;
              border: none;
              transition: transform 0.1s, background 0.1s;
            }
            .density-slider::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              background: rgba(255, 140, 50, 1);
            }
            .density-slider::-moz-range-thumb:hover {
              transform: scale(1.1);
              background: rgba(255, 140, 50, 1);
            }
            #control-buttons {
              position: fixed;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 15px;
              z-index: 10;
              background: rgba(0, 0, 0, 0.6);
              padding: 10px 15px;
              border-radius: 10px;
              border: 1px solid rgba(255, 120, 50, 0.2);
            }
            .control-button {
              background: rgba(255, 120, 50, 0.2);
              color: #eee;
              border: 1px solid rgba(255, 150, 50, 0.3);
              padding: 8px 15px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: background-color 0.2s, transform 0.1s;
              white-space: nowrap;
              min-width: 80px;
              text-align: center;
              font-family: 'Inter', sans-serif;
            }
            .control-button:hover, .control-button:focus {
              background: rgba(255, 120, 50, 0.4);
              outline: none;
            }
            .control-button:active {
              background: rgba(255, 120, 50, 0.6);
              transform: scale(0.95);
            }
            @media (max-width: 640px) {
              #instructions-container {
                max-width: calc(100% - 40px);
                font-size: 13px;
                padding: 10px 15px;
                top: 10px;
                left: 10px;
              }
              #instruction-title {
                font-size: 14px;
              }
              #theme-selector {
                top: auto;
                bottom: 20px;
                right: 10px;
                left: auto;
                transform: none;
                max-width: 120px;
                padding: 10px;
              }
              #theme-selector-title {
                font-size: 14px;
              }
              .theme-button {
                width: 30px;
                height: 30px;
              }
              .density-label {
                font-size: 12px;
              }
              #control-buttons {
                bottom: 10px;
                gap: 10px;
                padding: 8px 10px;
              }
              .control-button {
                padding: 6px 10px;
                font-size: 12px;
                min-width: 65px;
              }
            }
            @media (max-width: 400px) {
              #theme-selector {
                flex-direction: column;
                align-items: center;
                max-width: none;
                width: calc(100% - 20px);
                left: 10px;
                right: 10px;
                bottom: 75px;
              }
              .theme-grid {
                grid-template-columns: repeat(4, 1fr);
                width: 100%;
                justify-items: center;
              }
              #density-controls {
                width: 80%;
                margin-top: 15px;
              }
              #control-buttons {
                width: calc(100% - 20px);
                justify-content: space-around;
              }
            }
          `,
        }}
      />

      {/* Instructions Panel */}
      <div id="instructions-container" className="ui-panel" style={{ userSelect: "none" }}>
        <div id="instruction-title">Interactive Neural Network</div>
        <div>Click or tap to create energy pulses through the network. Drag to rotate.</div>
      </div>

      {/* Theme Selector Panel */}
      <div id="theme-selector" className="ui-panel">
        <div id="theme-selector-title">Visual Theme</div>
        <div className="theme-grid">
          {themes.map((_, i) => (
            <button
              key={i}
              className={`theme-button ${theme === i ? "active" : ""}`}
              id={`theme-${i + 1}`}
              data-theme={i}
              aria-label={`Theme ${i + 1}`}
              onClick={() => onThemeChange(i)}
            />
          ))}
        </div>
        <div id="density-controls">
          <div className="density-label">
            <span>Density</span>
            <span id="density-value">{density}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={density}
            className="density-slider"
            id="density-slider"
            aria-label="Network Density"
            onChange={onDensityChange}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div id="control-buttons" className="ui-panel">
        <button id="change-formation-btn" className="control-button" onClick={changeFormation}>
          Formation
        </button>
        <button id="pause-play-btn" className="control-button" onClick={togglePause}>
          {isPaused ? "Play" : "Pause"}
        </button>
        <button id="reset-camera-btn" className="control-button" onClick={resetCamera}>
          Reset Cam
        </button>
      </div>

      {/* Neural Network Canvas */}
      <canvas
        id="neural-network-canvas"
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </>
  );
}
