// src/pages/Home.jsx
import BackgroundEffect from "@/components/BackgroundEffect";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const facts = [
  {
    id: "ai-focus",
    title: "AI detects your distraction in real-time",
    color: "bg-blue-600",
    image: "/images/a.jpg",
    description:
      "FaceGuard uses real-time webcam input and AI to determine your concentration level. It helps minimize distractions and guides you back to productivity when focus drops.",
  },
  {
    id: "pomodoro",
    title: "Boosts your productivity with Pomodoro",
    color: "bg-blue-600",
    image: "/images/download.jpeg",
    description:
      "We integrate the Pomodoro method to maximize your efficiency. This cycle-based approach helps balance work and rest for long-term focus.",
  },
  {
    id: "data-driven",
    title: "Data-driven insights to improve over time",
    color: "bg-blue-600",
    image: "/images/images.jpeg",
    description:
      "FaceGuard collects non-sensitive behavioral data to generate focus charts, fatigue metrics, and personalized improvement tips.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedFact, setSelectedFact] = useState(null);

  return (
    <div className="relative min-h-screen pt-24 px-6 max-w-5xl mx-auto flex flex-col space-y-12 text-red overflow-hidden">
      <BackgroundEffect />
      <h1 className="text-4xl font-extrabold text-center drop-shadow-lg">
        Welcome to FaceGuard
      </h1>
      <p className="text-lg text-center text-gray-300">
        A smart, real-time productivity system that uses AI to keep you focused, balanced, and efficient.
      </p>

      {/* FACT BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 z-10">
        {facts.map(({ id, title, color }) => (
          <button
            key={id}
            className={`rounded-xl px-4 py-3 text-white font-semibold shadow-md transition-transform hover:scale-105 ${color}`}
            onClick={() => setSelectedFact(id)}
          >
            {title}
          </button>
        ))}
      </div>

      {/* ANIMATED FACT DETAIL MODAL */}
      <AnimatePresence>
        {selectedFact && (
          <motion.div
            key="fact-detail"
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="relative bg-gradient-to-br from-white to-gray-100 text-black rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
              <img
                src={facts.find(f => f.id === selectedFact)?.image}
                alt="Detail"
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <button
                  onClick={() => setSelectedFact(null)}
                  className="absolute top-3 right-4 text-2xl font-bold text-black hover:text-gray-600"
                >
                  ×
                </button>
                <h3 className="text-3xl font-extrabold mb-3">
                  {facts.find(f => f.id === selectedFact)?.title}
                </h3>
                <p className="text-gray-800 text-md leading-relaxed">
                  {facts.find(f => f.id === selectedFact)?.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-10 flex justify-center z-10">
        <Button
          className="text-lg px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800"
          onClick={() => navigate("/signup")}
        >
          Start Focus Session
        </Button>
      </div>
    </div>
  );
}
