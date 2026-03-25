"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import { useUserDoc } from "../../hooks/useUserDoc";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase/client";
import Link from "next/link";

export default function GameHubPage() {
  const { user } = useUserDoc();
  const [progress, setProgress] = useState<any>({});

  const dateKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = doc(db, "userProgress", `${user.uid}_${dateKey}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProgress(snap.data());
      }
    })();
  }, [user, dateKey]);

  const puzzles = [
    { id: 'crossword', title: 'Crossword', subtitle: '5×5 Crossword', link: '/puzzle/crossword', total: 25 },
    { id: 'sudoku', title: 'Sudoku', subtitle: '4×4 Sudoku', link: '/puzzle/sudoku', total: 16 },
    { id: 'memory', title: 'Memory', subtitle: 'Card Match', link: '/puzzle/memory', total: 8 } // pairs
  ];

  function getProgress(puzzleId: string) {
    const solved = progress?.solvedPuzzles?.includes(puzzleId);
    if (solved) return { completed: true, progress: 100 };
    let current = 0;
    if (puzzleId === 'crossword') {
      current = progress?.answers?.crossword?.filter((a: string) => a)?.length || 0;
    } else if (puzzleId === 'sudoku') {
      current = progress?.answers?.sudoku?.flat().filter((a: number | null) => a !== null)?.length || 0;
    } else if (puzzleId === 'memory') {
      // Memory doesn't save progress, only completion
      current = 0;
    }
    const total = puzzles.find(p => p.id === puzzleId)?.total || 1;
    return { completed: false, progress: Math.round((current / total) * 100) };
  }

  return (
    <AuthGuard>
      <section className="max-w-4xl mx-auto page-transition">
        <h2 className="text-2xl font-bold text-textPrimary">Game Hub</h2>
        <p className="text-sm text-textSecondary mt-2">Select today's puzzle to start playing.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {puzzles.map(puzzle => {
            const { completed, progress: prog } = getProgress(puzzle.id);
            const circumference = 2 * Math.PI * 30;
            const strokeDasharray = circumference;
            const strokeDashoffset = circumference - (prog / 100) * circumference;
            return (
              <Link key={puzzle.id} href={puzzle.link} className="block">
                <div className="p-6 rounded-lg glass hover:gradient-border transition-all duration-300 hover:scale-105">
                  <h3 className="text-lg font-semibold text-textPrimary">{puzzle.title}</h3>
                  <p className="text-sm text-textSecondary mt-2">{puzzle.subtitle}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative w-14 h-14">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-glass"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="text-accent progress-ring"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-textPrimary font-mono text-sm">
                        {prog}%
                      </div>
                    </div>
                    {completed ? (
                      <span className="inline-block px-3 py-1 glass text-accent text-sm rounded animate-bounce">Completed</span>
                    ) : (
                      <span className="inline-block px-3 py-1 glass text-textPrimary text-sm rounded hover:gradient-border transition-all duration-150">Play Now</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AuthGuard>
  );
}