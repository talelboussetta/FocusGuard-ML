// src/components/GlassCard.jsx
import React from 'react';

export default function GlassCard({ title, children }) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 hover:shadow-2xl transition-all duration-300">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
