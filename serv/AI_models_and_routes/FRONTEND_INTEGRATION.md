# Frontend Integration Guide - Distraction Detection

This guide explains how to integrate the YOLO-based distraction detection system with the React frontend.

## 🔌 WebSocket Connection

### 1. Establish Connection

```typescript
// In your session monitoring component
const sessionId = activeSession.id;
const token = localStorage.getItem('access_token');

const ws = new WebSocket(
  `ws://localhost:8000/distraction/ws/monitor?session_id=${sessionId}&token=${token}`
);

ws.onopen = () => {
  console.log('Connected to distraction monitor');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'connection') {
    console.log('Monitoring started:', data.message);
  }
  
  if (data.type === 'detection') {
    handleDetectionFrame(data);
  }
  
  if (data.type === 'alert') {
    handleDistractionAlert(data.data);
  }
};
```

### 2. Send Webcam Frames

```typescript
// Capture webcam frames and send to server
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

// Start webcam
const startWebcam = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  } catch (error) {
    console.error('Webcam access denied:', error);
  }
};

// Send frames at regular intervals (15 FPS = ~66ms)
useEffect(() => {
  if (!ws || !videoRef.current || !canvasRef.current) return;
  
  const interval = setInterval(() => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Send to server
    ws.send(JSON.stringify({
      type: 'frame',
      frame: frameData
    }));
  }, 66); // ~15 FPS
  
  return () => clearInterval(interval);
}, [ws]);
```

### 3. Handle Detection Results

```typescript
const handleDetectionFrame = (data: any) => {
  const {
    person_detected,
    phone_detected,
    phone_usage_duration,
    should_alert,
    distraction_active,
    total_distractions,
    fps
  } = data.data;
  
  // Update UI state
  setPersonPresent(person_detected);
  setPhoneDetected(phone_detected);
  setPhoneUsageDuration(phone_usage_duration);
  setDistractionCount(total_distractions);
  
  // Optionally display annotated frame
  if (data.annotated_frame) {
    setAnnotatedFrame(data.annotated_frame);
  }
};
```

### 4. Handle Alerts

```typescript
const handleDistractionAlert = (alert: any) => {
  const { alert_type, message, severity, duration, play_sound } = alert;
  
  // Show notification
  showNotification(message, severity);
  
  // Play alert sound
  if (play_sound) {
    const audio = new Audio('/sounds/alert.mp3');
    audio.play();
  }
  
  // Update distraction log
  addDistractionToLog({
    type: alert_type,
    severity,
    duration,
    timestamp: new Date()
  });
};
```

## 📊 Fetch Distraction Statistics

```typescript
// Get distraction events for a session
const fetchDistractionEvents = async (sessionId: string) => {
  const response = await fetch(
    `http://localhost:8000/distraction/sessions/${sessionId}/events`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.events; // Array of DistractionEventResponse
};

// Get distraction statistics
const fetchDistractionStats = async (sessionId: string) => {
  const response = await fetch(
    `http://localhost:8000/distraction/sessions/${sessionId}/stats`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const stats = await response.json();
  // stats.total_distractions
  // stats.phone_usage_count
  // stats.total_distraction_time_seconds
  // stats.severity_breakdown
  return stats;
};
```

## 🎨 UI Components

### Distraction Monitor Badge

```tsx
const DistractionMonitor = ({ isActive }: { isActive: boolean }) => {
  const [personPresent, setPersonPresent] = useState(true);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [phoneTime, setPhoneTime] = useState(0);
  
  return (
    <div className="distraction-monitor">
      <div className="status-badge">
        <span className={personPresent ? 'text-green-500' : 'text-red-500'}>
          {personPresent ? '👤 Present' : '👤 Absent'}
        </span>
      </div>
      
      {phoneDetected && (
        <div className="alert-badge text-orange-500">
          📱 Phone detected ({phoneTime.toFixed(1)}s)
        </div>
      )}
    </div>
  );
};
```

### Distraction Stats Card

```tsx
const DistractionStatsCard = ({ sessionId }: { sessionId: string }) => {
  const [stats, setStats] = useState<DistractionStats | null>(null);
  
  useEffect(() => {
    fetchDistractionStats(sessionId).then(setStats);
  }, [sessionId]);
  
  if (!stats) return <Loader />;
  
  return (
    <div className="stats-card">
      <h3>Distractions</h3>
      <div className="stat">
        <span>Total: {stats.total_distractions}</span>
      </div>
      <div className="stat">
        <span>Phone usage: {stats.phone_usage_count}</span>
      </div>
      <div className="stat">
        <span>Time lost: {Math.floor(stats.total_distraction_time_seconds / 60)}m</span>
      </div>
      <div className="severity-breakdown">
        <span className="low">Low: {stats.severity_breakdown.low}</span>
        <span className="medium">Medium: {stats.severity_breakdown.medium}</span>
        <span className="high">High: {stats.severity_breakdown.high}</span>
      </div>
    </div>
  );
};
```

## 🔐 Security Notes

1. **Token Validation**: The WebSocket currently uses a query parameter for the JWT token. In production, implement proper WebSocket authentication middleware.

2. **Session Validation**: Ensure the session belongs to the authenticated user before starting monitoring.

3. **Rate Limiting**: Consider client-side frame rate limiting to reduce bandwidth usage.

## 📱 Mobile Considerations

- WebSocket connections work on mobile browsers
- Webcam access requires HTTPS in production
- Consider reducing frame resolution on mobile (320x240)
- Adjust frame rate based on network conditions

## 🎯 Best Practices

1. **Only monitor during active sessions**: Check if `activeSession` exists before connecting
2. **Clean up connections**: Close WebSocket when session ends or component unmounts
3. **Handle reconnections**: Implement exponential backoff for reconnection attempts
4. **User consent**: Show a clear indicator when camera monitoring is active
5. **Privacy controls**: Allow users to disable monitoring in settings

## 🐛 Debugging

Enable verbose logging:
```typescript
ws.onopen = () => console.log('WS: Connected');
ws.onclose = () => console.log('WS: Closed');
ws.onerror = (err) => console.error('WS: Error', err);
ws.onmessage = (e) => console.log('WS: Message', e.data);
```

## 🔄 Complete Example Hook

```typescript
import { useEffect, useRef, useState } from 'react';

export const useDistractionMonitor = (sessionId: string | null, enabled: boolean) => {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (!sessionId || !enabled) return;
    
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(
      `ws://localhost:8000/distraction/ws/monitor?session_id=${sessionId}&token=${token}`
    );
    
    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'detection') {
        setStats(data.data);
      }
    };
    
    wsRef.current = ws;
    
    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    
    return () => {
      ws.close();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach(track => track.stop());
      }
    };
  }, [sessionId, enabled]);
  
  return { connected, stats, videoRef };
};
```
