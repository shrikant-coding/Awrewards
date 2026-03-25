"use client";

import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase/client";

interface LeaderboardEntry {
  id: string;
  displayName: string;
  streakCount: number;
  totalFragments: number;
}

export default function Leaderboards() {
  const [fastestToday, setFastestToday] = useState<LeaderboardEntry[]>([]);
  const [topStreaks, setTopStreaks] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        // Top streaks
        const streakQuery = query(
          collection(db, "users"),
          orderBy("streakCount", "desc"),
          limit(10)
        );
        const streakSnap = await getDocs(streakQuery);
        const streaks = streakSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as LeaderboardEntry));
        setTopStreaks(streaks);

        // For fastest today, we'd need completion time tracking
        // This is a simplified version
        setFastestToday(streaks.slice(0, 5));
      } catch (error) {
        console.error('Error fetching leaderboards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-lg glass">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Leaderboards</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-glass rounded"></div>
          <div className="h-6 bg-glass rounded"></div>
          <div className="h-6 bg-glass rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg glass">
      <h3 className="text-lg font-semibold text-textPrimary mb-4">Leaderboards</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Streaks */}
        <div>
          <h4 className="text-md font-semibold text-textPrimary mb-3">🔥 Top Streaks</h4>
          <div className="space-y-2">
            {topStreaks.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded glass">
                <div className="flex items-center gap-3">
                  <span className="text-accent font-bold">#{index + 1}</span>
                  <span className="text-textPrimary">{user.displayName}</span>
                </div>
                <span className="text-accent font-mono">{user.streakCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fastest Today */}
        <div>
          <h4 className="text-md font-semibold text-textPrimary mb-3">⚡ Fastest Today</h4>
          <div className="space-y-2">
            {fastestToday.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded glass">
                <div className="flex items-center gap-3">
                  <span className="text-accent font-bold">#{index + 1}</span>
                  <span className="text-textPrimary">{user.displayName}</span>
                </div>
                <span className="text-gold font-mono">Today</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}