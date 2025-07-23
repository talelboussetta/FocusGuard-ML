// src/components/SessionModal.jsx
import React from 'react';

export default function SessionModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white text-gray-800 rounded-2xl p-6 max-w-md w-full shadow-lg animate-fade-in">
        <h2 className="text-xl font-bold mb-4">Start Focus Session</h2>
        <p className="mb-4">
          This session will activate your webcam and begin tracking mouse & keyboard activity for real-time feedback.
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
            I Agree, Start
          </button>
        </div>
      </div>
    </div>
  );
}
