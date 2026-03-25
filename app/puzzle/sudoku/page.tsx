"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import SudokuGrid from "../../../components/SudokuGrid";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase/client";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const samplePuzzle = {
  // 4x4 sudoku: null for empty, number for given
  grid: [
    [1, null, null, 4],
    [null, 3, null, null],
    [null, null, 4, null],
    [3, null, null, 2]
  ],
  solution: [
    [1, 2, 3, 4],
    [4, 3, 2, 1],
    [2, 1, 4, 3],
    [3, 4, 1, 2]
  ]
};

export default function SudokuPage() {
  const { user, userDoc } = useUserDoc();
  const [puzzle, setPuzzle] = useState<typeof samplePuzzle | null>(null);
  const [answers, setAnswers] = useState<(number | null)[][]>([]);
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
      const existingAnswers = snap.exists() ? snap.data()?.answers?.sudoku || [] : [];
      setAnswers(existingAnswers);
      const solved = snap.exists() ? (snap.data()?.solvedPuzzles || []).includes("sudoku") : false;
      setCompleted(solved);
    })();
  }, [user, dateKey]);

  async function handleChange(newAnswers: (number | null)[][], isComplete: boolean) {
    setAnswers(newAnswers);
    setCompleted(isComplete);
    // save progress
    if (!user) return;
    const ref = doc(db, "userProgress", `${user.uid}_${dateKey}`);
    await setDoc(ref, { uid: user.uid, answers: { sudoku: newAnswers }, updatedAt: serverTimestamp() }, { merge: true });

    if (isComplete && !completed) {
      // mark as solved
      await updateDoc(ref, {
        solvedPuzzles: arrayUnion("sudoku"),
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        // fallback to set if update fails
        await setDoc(ref, { solvedPuzzles: ["sudoku"] }, { merge: true });
      });

      // update user doc with fragments
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fragments: arrayUnion("sudoku")
      }).catch(async (err) => {
        // create if not exists
        await setDoc(userRef, { fragments: ["sudoku"] }, { merge: true });
      });

      // Achievement popup
      toast.success("🎉 Achievement Unlocked: Sudoku Solver! Fragment awarded.", {
        duration: 4000,
        style: {
          background: 'var(--card)',
          color: 'var(--text)',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      });

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  }

  const progress = answers.length > 0 ? (answers.flat().filter(a => a !== null).length / 16) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AuthGuard>
      <section className="page-transition">
        <h2 className="text-2xl font-bold text-textPrimary">Sudoku (4×4)</h2>
        <p className="text-sm text-textSecondary mt-2">Click cells to select numbers from the wheel, or drag numbers to place. Complete the puzzle to earn a fragment.</p>

        <div className="mt-6">
          {/* Progress Ring */}
          {!completed && answers.length > 0 && (
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
              <p className="text-sm text-textSecondary">Progress: {answers.flat().filter(a => a !== null).length}/16</p>
            </div>
          )}

          {!puzzle && <div className="skeleton h-8 w-32 rounded"></div>}
          {puzzle && (
            <SudokuGrid
              puzzle={puzzle.grid}
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
                  const empties: { r: number; c: number }[] = [];
                  for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                      if (puzzle.grid[r][c] === null && answers[r][c] === null) {
                        empties.push({ r, c });
                      }
                    }
                  }
                  if (empties.length > 0) {
                    const random = empties[Math.floor(Math.random() * empties.length)];
                    const newAnswers = answers.map(row => [...row]);
                    newAnswers[random.r][random.c] = puzzle.solution[random.r][random.c];
                    handleChange(newAnswers, false); // Save
                    toast.success("Hint used! Cell revealed.", { duration: 2000 });
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
                  setAnswers(Array.from({ length: 4 }, () => Array(4).fill(null)));
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