"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase/client";

interface Code {
  id: string;
  code: string;
  value: number;
  status: string;
}

export default function DailyRewardPreview() {
  const [tomorrowCodes, setTomorrowCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTomorrowCodes = async () => {
      try {
        // For demo purposes, show a preview of available codes
        // In a real implementation, you might have scheduled codes for tomorrow
        const q = query(collection(db, "codes"), where("status", "==", "available"));
        const snap = await getDocs(q);
        const codes = snap.docs.map(d => ({ id: d.id, ...d.data() } as Code));

        // Show next 3 available codes as preview
        setTomorrowCodes(codes.slice(0, 3));
      } catch (error) {
        console.error('Error fetching tomorrow codes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTomorrowCodes();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-lg glass">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Tomorrow's Rewards</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-glass rounded w-3/4"></div>
          <div className="h-4 bg-glass rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg glass">
      <h3 className="text-lg font-semibold text-textPrimary mb-4">Tomorrow's Rewards</h3>
      <p className="text-sm text-textSecondary mb-4">Potential codes you could unlock</p>
      <div className="space-y-2">
        {tomorrowCodes.length > 0 ? (
          tomorrowCodes.map((code) => (
            <div key={code.id} className="p-3 rounded glass text-sm flex justify-between items-center text-textPrimary opacity-75">
              <span className="font-mono">***{code.code.slice(-4)}</span>
              <span className="text-gold">${code.value}</span>
            </div>
          ))
        ) : (
          <p className="text-textSecondary">No rewards available</p>
        )}
      </div>
    </div>
  );
}