"use client";

import React, { useState, useEffect } from "react";
import { soundManager } from "../lib/sound";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('soundEnabled');
    if (saved !== null) {
      const isEnabled = saved === 'true';
      setEnabled(isEnabled);
      soundManager.setEnabled(isEnabled);
    }
  }, []);

  const toggleSound = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    soundManager.setEnabled(newEnabled);
    localStorage.setItem('soundEnabled', newEnabled.toString());

    // Play a test sound when enabling
    if (newEnabled) {
      soundManager.playClick();
    }
  };

  return (
    <button
      onClick={toggleSound}
      className="flex items-center gap-2 p-2 rounded-lg glass hover:gradient-border transition-all duration-150"
      title={enabled ? "Disable sound effects" : "Enable sound effects"}
    >
      <span className="text-lg">{enabled ? "🔊" : "🔇"}</span>
      <span className="text-sm text-textPrimary">Sound</span>
    </button>
  );
}