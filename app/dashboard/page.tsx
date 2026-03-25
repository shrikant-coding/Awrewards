"use client";

import React, { useState, useEffect, useRef } from "react";
import AuthGuard from "../../components/AuthGuard";
import { useUserDoc } from "../../hooks/useUserDoc";
import { getIdToken } from "../../lib/firebase/client";
import { db } from "../../lib/firebase/client";
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import confetti from "canvas-confetti";
import CountdownTimer from "../../components/CountdownTimer";
import ActivityChart from "../../components/ActivityChart";
import DailyRewardPreview from "../../components/DailyRewardPreview";
import DailyCheckIn from "../../components/DailyCheckIn";
import Leaderboards from "../../components/Leaderboards";
import ProfileBadges from "../../components/ProfileBadges";
import { checkAchievements, triggerAchievement } from "../../lib/achievements";
import { soundManager } from "../../lib/sound";
import { hapticManager } from "../../lib/haptic";

export default function DashboardPage() {
  const { user, userDoc } = useUserDoc();
  const [unlocking, setUnlocking] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [claimedCodes, setClaimedCodes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [unlockedCode, setUnlockedCode] = useState<any>(null);
  const [todayProgress, setTodayProgress] = useState<any>({});
  const [seenAchievements, setSeenAchievements] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const hasIncrementedOpen = useRef(false);
  const startTime = useRef(Date.now());
  const fragments = userDoc?.fragments || [];
  const boosts = userDoc?.boosts || 0;
  const points = userDoc?.current_points_balance || 0;
  const unclaimedFragments = Math.max(0, 3 - fragments.length);

  const dateKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      if (online) {
        const q = query(collection(db, "codes"), where("status", "==", "available"));
        const snap = await getDocs(q);
        setAvailableCodes(snap.docs.map(d => d.data()));
        localStorage.setItem('availableCodes', JSON.stringify(snap.docs.map(d => d.data())));
      } else {
        const cached = localStorage.getItem('availableCodes');
        if (cached) setAvailableCodes(JSON.parse(cached));
      }
    })();
  }, [user, online]);

  useEffect(() => {
    if (!user) return;
    const claimedRef = collection(db, "claimedCodes", user.uid, "codes");
    const unsub = onSnapshot(claimedRef, (snap) => {
      const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClaimedCodes(codes);
      if (online) localStorage.setItem(`claimedCodes_${user.uid}`, JSON.stringify(codes));
    });
    if (!online) {
      const cached = localStorage.getItem(`claimedCodes_${user.uid}`);
      if (cached) setClaimedCodes(JSON.parse(cached));
    }
    return unsub;
  }, [user, online]);

  useEffect(() => {
    if (!user) return;
    const progressRef = doc(db, "userProgress", `${user.uid}_${dateKey}`);
    const unsub = onSnapshot(progressRef, (snap) => {
      const progress = snap.exists() ? snap.data() : {};
      setTodayProgress(progress);
      if (online) localStorage.setItem(`todayProgress_${user.uid}_${dateKey}`, JSON.stringify(progress));
    });
    if (!online) {
      const cached = localStorage.getItem(`todayProgress_${user.uid}_${dateKey}`);
      if (cached) setTodayProgress(JSON.parse(cached));
    }
    return unsub;
  }, [user, dateKey, online]);

  // Check for new achievements
  useEffect(() => {
    if (!userDoc || !todayProgress) return;

    const unlockedAchievements = checkAchievements(userDoc, todayProgress);
    unlockedAchievements.forEach(achievement => {
      if (!seenAchievements.has(achievement.id)) {
        triggerAchievement(achievement);
        setSeenAchievements(prev => new Set([...prev, achievement.id]));
      }
    });
  }, [userDoc, todayProgress, seenAchievements]);

  // Cache userDoc for offline
  useEffect(() => {
    if (userDoc && online) {
      localStorage.setItem(`userDoc_${user?.uid}`, JSON.stringify(userDoc));
    } else if (!online && user) {
      const cached = localStorage.getItem(`userDoc_${user.uid}`);
      if (cached) {
        // Note: In real impl, might need to merge or use cached userDoc, but for now, rely on hook
      }
    }
  }, [userDoc, online, user]);

  // Track app opens
  useEffect(() => {
    if (!user || hasIncrementedOpen.current) return;
    const today = new Date().toISOString().slice(0, 10);
    const userRef = doc(db, "users", user.uid);
    updateDoc(userRef, {
      [`activity_logs.${today}.open_count`]: increment(1)
    }).catch(console.error);
    hasIncrementedOpen.current = true;
  }, [user]);

  // Track usage time
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMinutes = Math.floor((now - startTime.current) / 60000);
      if (elapsedMinutes >= 1) {
        const today = new Date().toISOString().slice(0, 10);
        const userRef = doc(db, "users", user.uid);
        updateDoc(userRef, {
          [`activity_logs.${today}.total_minutes`]: increment(1)
        }).catch(console.error);
        startTime.current = now;
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  // Update app badge for unclaimed fragments
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (unclaimedFragments > 0) {
        navigator.setAppBadge(unclaimedFragments);
      } else {
        navigator.clearAppBadge();
      }
    }
  }, [unclaimedFragments]);

  // Pull to refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh available codes
      const q = query(collection(db, "codes"), where("status", "==", "available"));
      const snap = await getDocs(q);
      setAvailableCodes(snap.docs.map(d => d.data()));

      // Refresh claimed codes
      if (user) {
        const claimedRef = collection(db, "claimedCodes", user.uid, "codes");
        const claimedSnap = await getDocs(claimedRef);
        setClaimedCodes(claimedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      soundManager.playSuccess();
      hapticManager.light();
    } catch (error) {
      console.error('Refresh failed:', error);
      soundManager.playError();
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  };

  // Touch event handlers for pull-to-refresh
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY);
    const resistance = 0.5; // Make it harder to pull
    setPullDistance(diff * resistance);

    if (diff > 80) {
      e.preventDefault(); // Prevent default scrolling when pulled enough
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  };

  async function handleUnlock() {
    soundManager.playClick();
    hapticManager.click();
    setUnlocking(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/claim", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to claim");

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Play success sound and haptic
      soundManager.playSuccess();
      hapticManager.success();

      // Show modal with unlocked code
      setUnlockedCode(json);
      setShowModal(true);

      // Refresh available codes
      const q = query(collection(db, "codes"), where("status", "==", "available"));
      const snap = await getDocs(q);
      setAvailableCodes(snap.docs.map(d => d.data()));
    } catch (err: any) {
      soundManager.playError();
      hapticManager.error();
      alert(err.message || "Error unlocking");
    } finally {
      setUnlocking(false);
    }
  }

  const progress = (fragments.length / 3) * 100;
  const circumference = 2 * Math.PI * 40; // radius 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Calculate today's puzzle progress
  const solvedPuzzles = todayProgress?.solvedPuzzles?.length || 0;
  const totalPuzzles = 3;
  const puzzleProgress = (solvedPuzzles / totalPuzzles) * 100;

  const streakCount = userDoc?.streakCount || 0;
  const fireSize = Math.min(streakCount * 2, 100); // Max 100px

  return (
    <AuthGuard>
      <section
        className="max-w-4xl mx-auto page-transition relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Pull to refresh indicator */}
        {pullDistance > 0 && (
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
            style={{ marginTop: `${Math.max(0, pullDistance - 60)}px` }}
          >
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center transition-transform ${pullDistance > 80 ? 'rotate-180' : ''}`}>
                <span className="text-accent">↓</span>
              </div>
              <span className="text-sm text-accent mt-1">
                {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </div>
        )}

        {!online && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-600 px-4 py-2 rounded-full flex items-center gap-2">
            <span className="text-sm text-white">Offline - Showing cached data</span>
          </div>
        )}
        {refreshing && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-glass px-4 py-2 rounded-full flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full"></div>
            <span className="text-sm text-textPrimary">Refreshing...</span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-textPrimary">Dashboard</h2>
        <p className="text-sm text-textSecondary mt-2">Track your progress and claim rewards.</p>

        {/* Daily Streak Counter */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg glass text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-6xl animate-pulse" style={{ fontSize: `${fireSize}px` }}>
                🔥
              </div>
              <div>
                <h3 className="text-xl font-bold text-textPrimary">{streakCount} Day Streak</h3>
                <p className="text-sm text-textSecondary">Keep it up!</p>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="p-6 rounded-lg glass text-center">
            <CountdownTimer />
          </div>
        </div>

        {/* Daily Reward Preview */}
        <div className="mt-6">
          <DailyRewardPreview />
        </div>

        {/* Daily Check-In */}
        <div className="mt-6">
          <DailyCheckIn
            lastCheckinDate={userDoc?.last_checkin_date}
            checkinStreak={userDoc?.checkin_streak || 0}
            onCheckInSuccess={(points, streak) => {
              // The userDoc will update automatically via the hook
            }}
          />
        </div>

        {/* Real-time Progress Bar */}
        <div className="mt-6 p-6 rounded-lg glass">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-textPrimary">Today's Puzzles</h3>
            <span className="text-sm text-textSecondary">{solvedPuzzles}/{totalPuzzles} solved</span>
          </div>
          <div className="w-full bg-glass rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primaryFrom to-primaryTo transition-all duration-500 ease-out"
              style={{ width: `${puzzleProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Activity Dashboard */}
        <div className="mt-6">
          <ActivityChart activityLogs={userDoc?.activity_logs || {}} />
        </div>

        {/* Leaderboards and Profile Badges */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Leaderboards />
          <ProfileBadges
            streakCount={streakCount}
            totalFragments={(userDoc?.fragments?.length || 0) + (userDoc?.totalFragments || 0)}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg glass">
            <h3 className="text-lg font-semibold text-textPrimary">Fragments Collected</h3>
            <p className="text-sm text-textSecondary mt-2">{fragments.length}/3</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="transparent"
                    className="text-glass"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="text-accent progress-ring"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-textPrimary font-mono text-lg">
                  {fragments.length}/3
                </div>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`w-12 h-12 rounded-md flex items-center justify-center text-2xl transition-all duration-300 ${i < fragments.length ? 'bg-gold text-background animate-bounce' : 'bg-glass text-textSecondary'}`}>
                    {i < fragments.length ? '★' : '☆'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg glass">
            <h3 className="text-lg font-semibold text-textPrimary">Boosts Available</h3>
            <p className="text-sm text-textSecondary mt-2">Earn boosts at streak milestones</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-3xl animate-pulse">
                ⚡
              </div>
              <div className="text-textPrimary font-mono text-2xl">
                {boosts}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg glass">
            <h3 className="text-lg font-semibold text-textPrimary">Redeem Rewards</h3>
            <p className="text-sm text-textSecondary mt-2">Available codes</p>
            <div className="mt-4 space-y-2">
              {availableCodes.length > 0 ? (
                availableCodes.map((code, i) => (
                  <div key={i} className="p-2 rounded glass text-sm text-textPrimary">
                    {code.code} - ${code.value}
                  </div>
                ))
              ) : (
                <p className="text-textSecondary">No codes available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="p-6 rounded-lg glass">
            <h3 className="text-lg font-semibold text-textPrimary">Your Vault</h3>
            <p className="text-sm text-textSecondary mt-2">Claimed codes</p>
            <div className="mt-4 space-y-2">
              {claimedCodes.length > 0 ? (
                claimedCodes.map((code) => (
                  <div key={code.id} className="p-3 rounded glass text-sm flex justify-between items-center text-textPrimary">
                    <span className="font-mono text-accent">{code.code}</span>
                    <span className="text-gold">${code.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-textSecondary">No claimed codes yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            disabled={fragments.length < 3 || unlocking}
            onClick={handleUnlock}
            className={`px-8 py-4 rounded-md text-textPrimary text-lg font-semibold disabled:opacity-50 transition-all duration-300 ripple ${
              fragments.length >= 3 ? 'bg-gradient-to-r from-primaryFrom to-primaryTo glass gradient-border shadow-lg animate-pulse' : 'glass text-textSecondary'
            }`}
          >
            {unlocking ? 'Unlocking...' : 'Unlock Code'}
          </button>
        </div>

        {showModal && unlockedCode && (
          <div className="fixed inset-0 glass flex items-center justify-center z-50">
            <div className="glass p-8 rounded-lg max-w-md w-full mx-4 text-center gradient-border">
              <h2 className="text-2xl font-bold text-textPrimary mb-4 animate-bounce">🎉 Code Unlocked!</h2>
              <div className="glass p-4 rounded mb-4">
                <p className="text-sm text-textSecondary mb-2">Your Reward Code:</p>
                <p className="text-xl font-mono text-accent">{unlockedCode.code}</p>
                <p className="text-sm text-gold mt-2">${unlockedCode.value} value</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 glass text-textPrimary rounded hover:gradient-border transition-all duration-150 ripple"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </section>
    </AuthGuard>
  );
}