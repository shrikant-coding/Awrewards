"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { useAuth } from "./useAuth";

export function useUserDoc() {
  const { user } = useAuth();
  const [userDoc, setUserDoc] = useState<any | null>(null);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      return;
    }

    // Update last_online timestamp when user becomes active
    const updateLastOnline = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          last_online: new Date()
        }, { merge: true });
      } catch (error) {
        console.error("Failed to update last_online:", error);
      }
    };

    updateLastOnline();

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => setUserDoc(snap.exists() ? snap.data() : null), (error) => {
      console.error("useUserDoc: Snapshot error:", error);
    });
    return unsub;
  }, [user]);

  return { user, userDoc };
}