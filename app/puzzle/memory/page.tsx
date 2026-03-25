"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import MemoryGrid from "../../../components/MemoryGrid";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase/client";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const samplePuzzle = {
  cards: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']
};

export default function MemoryPage() {
  const { user, userDoc } = useUserDoc();
  const [puzzle, setPuzzle] = useState<typeof samplePuzzle | null>(null);
  const [completed, setCompleted] = useState(false);
  const dateKey = new Date().toISOString().slice(0, 10);
  const boosts = userDoc?.boosts || 0;

  useEffect(() => {
    async function loadPuzzle() {
      try {
        const ref = doc(db, "dailyPuzzles", dateKey);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.cards && Array.isArray(data.cards)) {
            setPuzzle(data as any);
          } else {
            setPuzzle(samplePuzzle);
          }
        } else {
          setPuzzle(samplePuzzle);
        }
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
      const solved = snap.exists() ? (snap.data()?.solvedPuzzles || []).includes("memory") : false;
      setCompleted(solved);
    })();
  }, [user, dateKey]);

  async function handleComplete() {
    setCompleted(true);
    if (!user) return;
    const ref = doc(db, "userProgress", `${user.uid}_${dateKey}`);
    await updateDoc(ref, {
      solvedPuzzles: arrayUnion("memory"),
      updatedAt: serverTimestamp()
    }).catch(async (err) => {
      await setDoc(ref, { solvedPuzzles: ["memory"] }, { merge: true });
    });

    // update user doc with fragments
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      fragments: arrayUnion("memory")
    }).catch(async (err) => {
      await setDoc(userRef, { fragments: ["memory"] }, { merge: true });
    });
  }

  return (
    <AuthGuard>
      <section className="page-transition">
        <h2 className="text-2xl font-bold text-textPrimary">Memory Match</h2>
        <p className="text-sm text-textSecondary mt-2">Flip cards to find matching pairs. Complete all pairs to earn a fragment.</p>

        <div className="mt-6">
          {!puzzle && <div className="skeleton h-8 w-32 rounded"></div>}
          {puzzle && !completed && (
            <MemoryGrid
              cards={puzzle.cards}
              onComplete={handleComplete}
            />
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
              <div className="p-4 rounded-md glass text-textPrimary">Keep flipping — good luck!</div>
            )}
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}