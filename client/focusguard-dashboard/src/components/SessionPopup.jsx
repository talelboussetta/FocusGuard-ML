// src/components/SessionPopup.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function SessionPopup({ onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handlePermissions = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      document.addEventListener('mousemove', () => {}, { once: true });
      document.addEventListener('keydown', () => {}, { once: true });
      onConfirm();
    } catch (err) {
      alert("Please grant camera access to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Start Focus Session</h2>
        <p className="mb-6 text-gray-300">
          To begin, we need your permission to access your webcam, mouse activity, and keyboard input.
        </p>
        <Button 
          onClick={handlePermissions} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 w-full py-3 rounded-lg"
        >
          {loading ? 'Checking permissions…' : 'Allow & Start'}
        </Button>
      </div>
    </motion.div>
  );
}
