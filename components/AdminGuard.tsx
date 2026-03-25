"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { useUserDoc } from "../hooks/useUserDoc";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { userDoc } = useUserDoc();
  const router = useRouter();

  console.log('AdminGuard: user', user);
  console.log('AdminGuard: authLoading', authLoading);
  console.log('AdminGuard: userDoc', userDoc);

  React.useEffect(() => {
    console.log('AdminGuard useEffect: checking access', { authLoading, user, userDocRole: userDoc?.role });
    if (!authLoading && (!user || userDoc?.role !== "admin")) {
      console.log('AdminGuard: redirecting to /');
      router.push("/");
    } else {
      console.log('AdminGuard: access granted');
    }
  }, [user, userDoc, authLoading, router]);

  if (authLoading || !userDoc) {
    console.log('AdminGuard: showing loading');
    return <div className="py-20 text-center">Loading...</div>;
  }
  if (userDoc.role !== "admin") {
    console.log('AdminGuard: not admin, returning null');
    return null;
  }

  console.log('AdminGuard: rendering children');
  return <>{children}</>;
}