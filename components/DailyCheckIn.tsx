"use client";

import React, { useState } from "react";
import { getIdToken } from "../lib/firebase/client";
import confetti from "canvas-confetti";
import { soundManager } from "../lib/sound";
import { hapticManager } from "../lib/haptic";

interface DailyCheckInProps {
  lastCheckinDate?: any;
  checkinStreak?: number;
  onCheckInSuccess?: (points: number, streak: number) => void;
}

export default function DailyCheckIn({ lastCheckinDate, checkinStreak = 0, onCheckInSuccess }: DailyCheckInProps) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastResult, setLastResult] = useState<{ message: string; points: number } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const lastCheckinStr = lastCheckinDate ? new Date(lastCheckinDate.toDate()).toISOString().slice(0, 10) : null;
  const canCheckIn = lastCheckinStr !== today;

  const handleCheckIn = async () => {
    if (!canCheckIn || checkingIn) return;

    soundManager.playClick();
    hapticManager.click();
    setCheckingIn(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Trigger confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      soundManager.playSuccess();
      hapticManager.success();

      console.log("Check-in API success:", { points: json.points, streak: json.streak, message: json.message });
      setLastResult({ message: json.message, points: json.points });
      onCheckInSuccess?.(json.points, json.streak);
    } catch (err: any) {
      soundManager.playError();
      hapticManager.error();
      setLastResult({ message: err.message, points: 0 });
    } finally {
      setCheckingIn(false);
    }
  };

  const nextPoints = Math.min((checkinStreak + 1) * 5, 35) + Math.max(0, (checkinStreak + 1) - 7) * 2;

  return (
    <div className="p-6 rounded-lg glass">
      <h3 className="text-lg font-semibold text-textPrimary mb-4">Daily Check-In</h3>
      <p className="text-sm text-textSecondary mb-4">
        Check in daily to earn points and build your streak!
      </p>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-textSecondary">Current Streak</p>
          <p className="text-xl font-bold text-accent">{checkinStreak} days</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-textSecondary">Next Reward</p>
          <p className="text-xl font-bold text-gold">{nextPoints} pts</p>
        </div>
      </div>

      <button
        disabled={!canCheckIn || checkingIn}
        onClick={handleCheckIn}
        className={`w-full py-3 px-4 rounded-md text-textPrimary font-semibold transition-all duration-300 ripple ${
          canCheckIn && !checkingIn
            ? 'bg-gradient-to-r from-green-500 to-green-600 glass gradient-border shadow-lg hover:scale-105'
            : 'bg-glass text-textSecondary cursor-not-allowed'
        }`}
      >
        {checkingIn ? 'Checking In...' : canCheckIn ? 'Check In Now' : 'Already Checked In Today'}
      </button>

      {lastResult && (
        <div className={`mt-4 p-3 rounded text-sm ${
          lastResult.points > 0
            ? 'bg-green-500/20 text-green-300'
            : 'bg-red-500/20 text-red-300'
        }`}>
          {lastResult.message}
          {lastResult.points > 0 && (
            <p className="font-bold mt-1">+{lastResult.points} points earned!</p>
          )}
        </div>
      )}
    </div>
  );
}