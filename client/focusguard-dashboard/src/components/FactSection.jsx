import { useEffect, useRef, useState } from "react";

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

  // Prediction & stats state
  const [predictionRaw, setPredictionRaw] = useState(null);
  const [predictionMessage, setPredictionMessage] = useState("Predicting...");
  const [stats, setStats] = useState({
    blink_count: 0,
    keypress_count: 0,
    mouse_click_count: 0,
    avg_blink_interval: 0,
    idle_time_sec: 0,
  });

  // Canvas stars animation
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
      const themeColors = [
        "rgba(99,102,241,0.8)",
        "rgba(251,191,36,0.8)",
        "rgba(236,72,153,0.8)",
        "rgba(16,185,129,0.8)",
      ];
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

  // Start/stop camera & timer on session change
  useEffect(() => {
    if (isSessionActive) {
      startCamera();
      startTimer();
    } else {
      stopTimer();
      stopCamera();
    }
    return () => {
      stopTimer();
      stopCamera();
    };
  }, [isSessionActive]);

  // Handle timer reaching zero
  useEffect(() => {
    if (isSessionActive && !isPaused && timeLeft === 0) {
      handleSessionEnd();
    }
  }, [timeLeft, isSessionActive, isPaused]);

  // Fetch prediction & stats every 20 seconds when session active & not paused
  useEffect(() => {
    if (isSessionActive && !isPaused) {
      fetchPrediction(); // fetch immediately on start
      const interval = setInterval(fetchPrediction, 20000);
      return () => clearInterval(interval);
    }
  }, [isSessionActive, isPaused]);

  async function fetchPrediction() {
    try {
      const response = await fetch("http://127.0.0.1:5000/predict");
      const data = await response.json();
      if (data.status === "success") {
        setPredictionRaw(data.prediction_raw);
        setPredictionMessage(data.message);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setPredictionMessage("Error fetching prediction");
      }
    } catch (err) {
      setPredictionMessage("Network error");
    }
  }

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
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

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
    setPredictionRaw(null);
    setPredictionMessage("Predicting...");
    setStats({
      blink_count: 0,
      keypress_count: 0,
      mouse_click_count: 0,
      avg_blink_interval: 0,
      idle_time_sec: 0,
    });
  }

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

      {/* Prediction Box */}
      <div className="fixed bottom-6 left-6 z-20 bg-black/70 backdrop-blur-md p-4 rounded-xl shadow-lg w-60 text-white">
        <h3 className="text-lg font-semibold mb-2">Focus Status</h3>
        <p
          className={`text-xl font-bold ${
            predictionRaw === 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {predictionMessage}
        </p>
      </div>

      {/* Live Stats Box */}
      <div className="fixed bottom-6 left-[280px] z-20 bg-black/70 backdrop-blur-md p-4 rounded-xl shadow-lg w-64 text-white">
        <h3 className="text-lg font-semibold mb-2">Live Stats</h3>
        <ul className="text-sm space-y-1">
          <li>
            <strong>Blinks:</strong> {stats.blink_count}
          </li>
          <li>
            <strong>Keypresses:</strong> {stats.keypress_count}
          </li>
          <li>
            <strong>Mouse Clicks:</strong> {stats.mouse_click_count}
          </li>
          <li>
            <strong>Avg Blink Interval:</strong> {stats.avg_blink_interval.toFixed(2)} s
          </li>
          <li>
            <strong>Idle Time:</strong> {stats.idle_time_sec} s
          </li>
        </ul>
      </div>

      {/* Settings Box */}
      <div className="fixed top-6 right-6 z-10 bg-black/40 backdrop-blur-sm p-4 rounded-xl shadow-lg space-y-2">
        <div className="text-sm font-semibold">Theme</div>
        <div className="flex space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              className={`w-6 h-6 rounded-full border-2 ${
                theme === i ? "border-white" : "border-transparent"
              }`}
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10">
        {[
          { title: "Focus Over Time", description: "Visualize your focus levels during sessions." },
          { title: "Fatigue Levels", description: "Track how fatigue changes during work." },
        ].map(({ title, description }, i) => (
          <div key={i} className="bg-black/60 rounded-xl p-6 shadow-lg flex flex-col space-y-2">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-gray-300">{description}</p>
            <div className="h-32 bg-gray-800 rounded-md mt-4 flex items-center justify-center text-gray-600 italic">
              Chart goes here
            </div>
          </div>
        ))}
      </section>

      <section className="bg-black/60 rounded-xl p-6 shadow-lg z-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">Tips & Suggestions</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          {[
            "Take deep breaths during breaks to refresh your mind.",
            "Maintain good posture to reduce fatigue.",
            "Avoid distractions by turning off notifications.",
          ].map((tip, i) => (
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
