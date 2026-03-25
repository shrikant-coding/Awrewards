"use client";

import { useEffect, useState } from "react";
import { auth, signInWithGoogle as _signInWithGoogle, signOut as _signOut } from "../lib/firebase/client";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading, signInWithGoogle: _signInWithGoogle, signOut: _signOut };
}