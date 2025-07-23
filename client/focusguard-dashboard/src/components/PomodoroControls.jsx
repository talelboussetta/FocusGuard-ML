// src/components/PomodoroControls.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PomodoroControls({ onStart, onPause, onStop, onShortBreak, onLongBreak, isRunning }) {
  const [color, setColor] = useState("blue");

  const handleColorChange = (newColor) => {
    setColor(newColor);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
      <Button
        onClick={onStart}
        className={`bg-${color}-600 hover:bg-${color}-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors`}
      >
        Start
      </Button>
      <Button
        onClick={onPause}
        className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-md transition-colors"
      >
        Pause
      </Button>
      <Button
        onClick={onStop}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors"
      >
        Stop
      </Button>
      <Button
        onClick={onShortBreak}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors"
      >
        Short Break
      </Button>
      <Button
        onClick={onLongBreak}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors"
      >
        Long Break
      </Button>
    </div>
  );
}
