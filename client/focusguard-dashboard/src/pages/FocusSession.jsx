import { useEffect, useRef, useState } from "react";
import { useCollector } from "../hooks/useCollector";
import "@tensorflow/tfjs-backend-webgl";

const WORK_DURATION = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const LONG_BREAK_INTERVAL = 4;

export default function FocusSession() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const ringtoneRef = useRef(null);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [sessionType, setSessionType] = useState("work");
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);
  const [theme, setTheme] = useState(0);
  const [density, setDensity] = useState(100);

  // New states for prediction and live stats
  const [focusLabel, setFocusLabel] = useState("Loading...");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  useCollector(isSessionActive && !isPaused, videoRef);

const scrollRef = useRef(null);

  // Animation and star field - unchanged
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let stars = [];
    for (let i = 0; i < density; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.1,
        vx: -0.8 + Math.random(),
        vy: -0.8 + Math.random(),
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      const themeColors = ["rgba(99,102,241,0.8)", "rgba(251,191,36,0.8)", "rgba(236,72,153,0.8)", "rgba(16,185,129,0.8)"];
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, 2 * Math.PI);
        ctx.fillStyle = themeColors[theme % themeColors.length];
        ctx.fill();
      }
      move();
    }

    function move() {
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;

        if (s.x < 0 || s.x > canvas.width) s.vx = -s.vx;
        if (s.y < 0 || s.y > canvas.height) s.vy = -s.vy;
      }
    }

    function update() {
      draw();
      requestAnimationFrame(update);
    }

    update();
  }, [theme, density]);

  // Camera & timer control unchanged
  useEffect(() => {
    if (isSessionActive) {
      startCamera();
      startTimer();
    } else {
      stopTimer();
      stopCamera();
      setFocusLabel("Session stopped");
      setStats(null);
    }
    return () => {
      stopTimer();
      stopCamera();
    };
  }, [isSessionActive]);

  useEffect(() => {
    if (isSessionActive && !isPaused && timeLeft === 0) {
      handleSessionEnd();
    }
  }, [timeLeft, isSessionActive, isPaused]);

  // Fetch prediction + stats every 10 seconds while session active and not paused
  useEffect(() => {
    if (isSessionActive && !isPaused) {
      const fetchPrediction = async () => {
        try {
          const response = await fetch("http://127.0.0.1:5000/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ dummy: true }), // or actual data if needed
});

          const data = await response.json();
          if (data.status === "success") {
            setFocusLabel(data.message);
            setStats(data.stats);
            setError(null);
          } else {
            setError(data.message || "Unknown error");
          }
        } catch (err) {
          setError("Failed to fetch prediction");
        }
      };

      fetchPrediction();
      const interval = setInterval(fetchPrediction, 10000);
      return () => clearInterval(interval);
    } else {
      // Reset on pause/stop
      setFocusLabel("Session paused");
      setStats(null);
    }
  }, [isSessionActive, isPaused]);

  // Timer functions unchanged
  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(t - 1, 0));
    }, 1000);
  }
  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Camera functions unchanged
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      console.error("Could not start camera", e);
    }
  }
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // Session control unchanged
  function handleSessionEnd() {
    ringtoneRef.current?.play();
    if (sessionType === "work") {
      const newCount = completedWorkSessions + 1;
      setCompletedWorkSessions(newCount);
      if (newCount % LONG_BREAK_INTERVAL === 0) {
        setSessionType("longBreak");
        setTimeLeft(LONG_BREAK);
      } else {
        setSessionType("shortBreak");
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setSessionType("work");
      setTimeLeft(WORK_DURATION);
    }
  }
  function handleStart() {
    setIsSessionActive(true);
    setIsPaused(false);
  }
  function handlePause() {
    setIsPaused(true);
    stopTimer();
  }
  function handleResume() {
    setIsPaused(false);
    startTimer();
  }
  function handleStop() {
    setIsSessionActive(false);
    setIsPaused(false);
    setTimeLeft(WORK_DURATION);
    setSessionType("work");
    setCompletedWorkSessions(0);
    stopCamera();
    setFocusLabel("Session stopped");
    setStats(null);
  }

  // UI content arrays unchanged
  const graphs = [
    { title: "Focus Over Time", description: "Visualize your focus levels during sessions." },
    { title: "Fatigue Levels", description: "Track how fatigue changes during work." },
  ];
  const tips = [
    "Take deep breaths during breaks to refresh your mind.",
    "Maintain good posture to reduce fatigue.",
    "Avoid distractions by turning off notifications.",
  ];

  return (
    <div className="relative min-h-screen pt-24 px-6 max-w-5xl mx-auto flex flex-col space-y-8 text-white">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0" />

      {/* Focus Status & Stats Box */}
      <div className="fixed top-24 left-6 z-20 bg-black/70 backdrop-blur-md p-5 rounded-xl shadow-lg w-72 text-white font-sans select-none">
        <h3 className="text-xl font-semibold mb-2">Focus Status</h3>
        <p
          className={`text-2xl font-bold ${
            focusLabel.toLowerCase().includes("focused") ? "text-green-400" : "text-red-400"
          }`}
        >
          {focusLabel}
        </p>

        {/* Show stats if available */}
        {stats && (
          <div className="mt-4 space-y-1 text-sm text-gray-300">
            <div>Blinks: <span className="font-medium text-white">{stats.blink_count}</span></div>
            <div>Key Presses: <span className="font-medium text-white">{stats.keypress_count}</span></div>
            <div>Mouse Clicks: <span className="font-medium text-white">{stats.mouse_click_count}</span></div>
            <div>Avg Blink Interval: <span className="font-medium text-white">{stats.avg_blink_interval.toFixed(2)}s</span></div>
            <div>Idle Time: <span className="font-medium text-white">{stats.idle_time_sec}s</span></div>
          </div>
        )}

        {/* Show error if any */}
        {error && <p className="mt-3 text-red-500 text-sm">Error: {error}</p>}
      </div>

      {/* Settings Box unchanged */}
      <div className="fixed top-6 right-6 z-10 bg-black/40 backdrop-blur-sm p-4 rounded-xl shadow-lg space-y-2">
        <div className="text-sm font-semibold">Theme</div>
        <div className="flex space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              className={`w-6 h-6 rounded-full border-2 ${theme === i ? "border-white" : "border-transparent"}`}
              style={{
                background:
                  i === 0 ? "#6366F1" : i === 1 ? "#FBBF24" : i === 2 ? "#EC4899" : "#10B981",
              }}
              onClick={() => setTheme(i)}
            />
          ))}
        </div>
        <div className="text-sm mt-2">Density</div>
        <input
          type="range"
          min={20}
          max={100}
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <h1 className="text-4xl font-extrabold text-center drop-shadow-lg z-10">Focus Session</h1>

      <div className="flex flex-col md:flex-row md:space-x-10 items-center justify-center z-10">
        <video
          ref={videoRef}
          className="w-80 h-60 rounded-xl bg-black shadow-lg mb-6 md:mb-0"
          autoPlay
          playsInline
          muted
        />

        <div className="flex flex-col items-center space-y-4 rounded-xl p-6 shadow-lg w-72 text-center select-none bg-black/60">
          <div className="text-6xl font-mono font-bold mb-4">{formatTime(timeLeft)}</div>
          <div className="flex space-x-4">
            {!isSessionActive && (
              <button
                onClick={handleStart}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
              >
                Start
              </button>
            )}
            {isSessionActive && !isPaused && (
              <>
                <button
                  onClick={handlePause}
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition"
                >
                  Pause
                </button>
                <button
                  onClick={handleStop}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Stop
                </button>
              </>
            )}
            {isSessionActive && isPaused && (
              <>
                <button
                  onClick={handleResume}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition"
                >
                  Resume
                </button>
                <button
                  onClick={handleStop}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>

  {/* Scrollable Graph Carousel */}
<div className="relative w-full z-10">
  {/* Left Arrow */}
  <button
    onClick={() => scrollRef.current.scrollBy({ left: -300, behavior: "smooth" })}
    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 p-2 rounded-full shadow-md"
  >
    ◀
  </button>

  {/* Graph Container */}
  <div
    ref={scrollRef}
    className="flex overflow-x-auto space-x-4 snap-x snap-mandatory scroll-smooth px-8 pb-4"
  >
    {/* Slide 1 */}
    <div className="min-w-[80%] snap-center bg-black/60 rounded-xl p-6 shadow-lg flex flex-col space-y-2">
      <h3 className="text-xl font-semibold text-white">Blinks Per Minute</h3>
      <p className="text-gray-300">Track how frequently you blink during focus sessions.</p>
      <div className="h-64 bg-gray-800 rounded-md mt-4 flex items-center justify-center text-gray-500 italic">
        Blink graph goes here
      </div>
    </div>

    {/* Slide 2 */}
    <div className="min-w-[80%] snap-center bg-black/60 rounded-xl p-6 shadow-lg flex flex-col space-y-2">
      <h3 className="text-xl font-semibold text-white">Clicks Per Minute</h3>
      <p className="text-gray-300">Monitor how actively you're interacting with your device.</p>
      <div className="h-64 bg-gray-800 rounded-md mt-4 flex items-center justify-center text-gray-500 italic">
        Click graph goes here
      </div>
    </div>

    {/* Slide 3 */}
    <div className="min-w-[80%] snap-center bg-black/60 rounded-xl p-6 shadow-lg flex flex-col space-y-2">
      <h3 className="text-xl font-semibold text-white">Focus Score</h3>
      <p className="text-gray-300">Visualize your predicted focus level over time.</p>
      <div className="h-64 bg-gray-800 rounded-md mt-4 flex items-center justify-center text-gray-500 italic">
        Focus graph goes here
      </div>
    </div>
  </div>

  {/* Right Arrow */}
  <button
    onClick={() => scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })}
    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 p-2 rounded-full shadow-md"
  >
    ▶
  </button>
</div>


      <section className="bg-black/60 rounded-xl p-6 shadow-lg z-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">Tips & Suggestions</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </section>

      <audio
        ref={ringtoneRef}
        src="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"
        preload="auto"
      />
    </div>
  );
}
