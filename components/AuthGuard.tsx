"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading) return <div className="py-20 text-center">Loading...</div>;
  return <>{children}</>;
}