"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import CrosswordGrid from "../../../components/CrosswordGrid";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase/client";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { awardPuzzleCompletionPoints } from "../../../lib/points";

const samplePuzzle = {
  // 25 letters A-Z, row-major
  solution: (
    "HELLO" +
    "WORLD" +
    "MAGIC" +
    "CODEX" +
    "UNITY"
  ).split("")
};

export default function CrosswordPage() {
  const { user, userDoc } = useUserDoc();
  const [puzzle, setPuzzle] = useState<typeof samplePuzzle | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const dateKey = new Date().toISOString().slice(0, 10);
  const boosts = userDoc?.boosts || 0;

  useEffect(() => {
    async function loadPuzzle() {
      try {
        const ref = doc(db, "dailyPuzzles", dateKey);
        const snap = await getDoc(ref);
        if (snap.exists()) setPuzzle(snap.data() as any);
        else setPuzzle(samplePuzzle);
      } catch (err) {
        setPuzzle(samplePuzzle);
      }
    }
    loadPuzzle();
  }, [dateKey]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = doc(db, "userProgress", `${user.uid}_${dateKey}`);
      const snap = await getDoc(ref);
      const existingAnswers = snap.exists() ? snap.data()?.answers?.crossword || [] : [];
      setAnswers(existingAnswers);
      const solved = snap.exists() ? (snap.data()?.solvedPuzzles || []).includes("crossword") : false;
      setCompleted(solved);
    })();
  }, [user, dateKey]);

  const [hasAwardedPoints, setHasAwardedPoints] = useState(false);

  async function handleChange(newAnswers: string[], isComplete: boolean) {
    setAnswers(newAnswers);
    setCompleted(isComplete);
    // save progress
    if (!user) return;
    const ref = doc(db, "userProgress", `${user.uid}_${dateKey}`);
    await setDoc(ref, { uid: user.uid, answers: { crossword: newAnswers }, updatedAt: serverTimestamp() }, { merge: true });

    if (isComplete && !completed) {
      // mark as solved
      await updateDoc(ref, {
        solvedPuzzles: arrayUnion("crossword"),
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        // fallback to set if update fails
        await setDoc(ref, { solvedPuzzles: ["crossword"] }, { merge: true });
      });

      // update user doc with fragments
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fragments: arrayUnion("crossword")
      }).catch(async (err) => {
        // create if not exists
        await setDoc(userRef, { fragments: ["crossword"] }, { merge: true });
      });

      // award points
      if (!hasAwardedPoints) {
        await awardPuzzleCompletionPoints(user.uid, "Crossword");
        setHasAwardedPoints(true);
      }
    }
  }

  const progress = (answers.filter(a => a).length / 25) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AuthGuard>
      <section className="page-transition">
        <h2 className="text-2xl font-bold text-textPrimary">Crossword (5×5)</h2>
        <p className="text-sm text-textSecondary mt-2">Type letters, auto-advance, and complete the puzzle to earn a fragment.</p>

        <div className="mt-6">
          {/* Progress Ring */}
          {!completed && (
            <div className="mb-4 flex items-center gap-4 glass p-4 rounded-lg">
              <div className="relative w-16 h-16">
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
                <div className="absolute inset-0 flex items-center justify-center text-textPrimary font-mono text-sm">
                  {Math.round(progress)}%
                </div>
              </div>
              <p className="text-sm text-textSecondary">Progress: {answers.filter(a => a).length}/25</p>
            </div>
          )}

          {!puzzle && <div className="skeleton h-8 w-32 rounded"></div>}
          {puzzle && (
            <CrosswordGrid
              solution={puzzle.solution}
              initialAnswers={answers}
              onChange={(a, c) => handleChange(a, c)}
            />
          )}

          {!completed && puzzle && (
            <div className="mt-4 flex gap-2">
              <button
                disabled={boosts <= 0}
                className={`px-4 py-2 glass text-textPrimary rounded hover:gradient-border transition-all duration-150 ripple ${boosts > 0 ? 'animate-pulse glow-accent' : 'opacity-50'}`}
                onClick={async () => {
                  if (boosts <= 0) return;
                  // Deduct boost
                  const userRef = doc(db, "users", user!.uid);
                  await updateDoc(userRef, { boosts: boosts - 1 });
                  // Hint: fill a random empty cell
                  const emptyIndices = answers.map((a, i) => (!a ? i : -1)).filter(i => i !== -1);
                  if (emptyIndices.length > 0) {
                    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                    const newAnswers = [...answers];
                    newAnswers[randomIndex] = puzzle.solution[randomIndex];
                    handleChange(newAnswers, false); // Save the change
                    toast.success("Hint used! Letter revealed.", { duration: 2000 });
                  } else {
                    toast.error("No empty cells to hint.", { duration: 2000 });
                  }
                }}
              >
                Hint (1 Boost)
              </button>
              <button
                className="px-4 py-2 glass text-textPrimary rounded hover:gradient-border transition-all duration-150 ripple"
                onClick={() => {
                  // Give up: reset progress
                  setAnswers(Array(25).fill(""));
                }}
              >
                Give Up
              </button>
            </div>
          )}

          <div className="mt-4">
            {completed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="p-4 rounded-md glass text-textPrimary text-center animate-bounce"
              >
                🎉 Completed! Fragment awarded. 🎉
              </motion.div>
            ) : (
              <div className="p-4 rounded-md glass text-textPrimary">Keep going — good luck!</div>
            )}
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}