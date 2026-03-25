"use client";

import React from "react";
import Link from "next/link";

export default function DashboardCard({ title, subtitle, link, progress = 0 }:{title:string, subtitle?:string, link:string, progress?:number}){
  const circumference = 2 * Math.PI * 20; // radius 20
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-4 rounded-lg glass gradient-border shadow-lg w-full md:w-1/3 hover:scale-105 transition-transform duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-textPrimary">{title}</div>
          <div className="text-sm text-textSecondary">{subtitle}</div>
        </div>
        <div className="relative w-14 h-14">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-glass"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="text-accent progress-ring"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-textPrimary font-mono text-sm">
            {progress}%
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Link href={link} className="inline-block px-4 py-2 rounded-md glass hover:gradient-border transition-all duration-150 ripple">
          Open
        </Link>
      </div>
    </div>
  );
}