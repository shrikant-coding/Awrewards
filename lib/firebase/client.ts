"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { addPoints, awardDailyLoginPoints, awardStreakBonusPoints } from "../points";

const firebaseConfig = {
  apiKey: "AIzaSyDCY5D2a9R4Vm_dqbU0HEGLRvfVZjEv55o",
  authDomain: "awrewards-34963.firebaseapp.com",
  projectId: "awrewards-34963",
  storageBucket: "awrewards-34963.firebasestorage.app",
  messagingSenderId: "527171899602",
  appId: "1:527171899602:web:b00f35b33dd0e677f65d0b",
  measurementId: "G-3H0XDFBQRT"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

console.log("Firebase client.ts: typeof window =", typeof window);
console.log("Firebase client.ts: isClient =", typeof window !== 'undefined');

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
} else {
  console.log("Firebase client.ts: Skipping analytics initialization on server");
}

export const auth = getAuth();
export const provider = new GoogleAuthProvider();
export const db = getFirestore();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  await createOrUpdateUserDoc(user);
  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

async function createOrUpdateUserDoc(user: FirebaseUser) {
  if (!user.uid) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const today = new Date().toISOString().slice(0, 10);

  if (!snap.exists()) {
    // First login: create document
    const base = {
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: "user",
      streakCount: 1, // Start with 1 on first login
      boosts: 0,
      fragments: [],
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      loginHistory: { [today]: 1 }, // Track login days
      totalLogins: 1,
      current_points_balance: 0
    };
    await setDoc(ref, base);
    // Award profile completion points
    await addPoints(user.uid, 100, 'Profile Completion');
  } else {
    // Subsequent login: update document
    const current = snap.data();
    const now = new Date();
    const lastSeenDate = current.lastSeen?.toDate ? current.lastSeen.toDate() : (current.lastSeen?.seconds ? new Date(current.lastSeen.seconds * 1000) : new Date(0));
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    let newStreak = current.streakCount || 0;
    if (lastSeenDate.toDateString() === yesterday.toDateString()) {
      newStreak += 1;
    } else if (lastSeenDate.toDateString() !== now.toDateString()) {
      newStreak = 1;
    }

    // Update login history
    const loginHistory = current.loginHistory || {};
    const todayCount = loginHistory[today] || 0;
    const isFirstLoginToday = todayCount === 0;
    loginHistory[today] = todayCount + 1;

    // Award boosts for streak milestones
    const oldStreak = current.streakCount || 0;
    let boostsToAdd = 0;
    const milestones = { 3: 1, 7: 1, 30: 2 };
    for (const [milestone, amount] of Object.entries(milestones)) {
      const m = parseInt(milestone);
      if (newStreak >= m && oldStreak < m) {
        boostsToAdd += amount;
      }
    }

    // Update lastSeen, displayName, photoURL, streakCount, loginHistory, boosts
    await setDoc(ref, {
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      lastSeen: serverTimestamp(),
      streakCount: newStreak,
      loginHistory,
      totalLogins: (current.totalLogins || 0) + 1,
      boosts: (current.boosts || 0) + boostsToAdd
    }, { merge: true });

    // Award points for daily login
    if (isFirstLoginToday) {
      await awardDailyLoginPoints(user.uid);
    }

    // Award points for streak milestones
    if (newStreak > oldStreak) {
      await awardStreakBonusPoints(user.uid, newStreak);
    }
  }
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}