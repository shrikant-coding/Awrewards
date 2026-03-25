"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

type Fragment = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
};

function ConstellationBackground() {
  const [fragments, setFragments] = useState<Fragment[]>([]);

  useEffect(() => {
    setFragments(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      delay: Math.random() * 10,
    })));
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 mesh-gradient overflow-hidden"
      style={{
        background: `
          radial-gradient(at var(--x1) var(--y1), #1e40af 0px, transparent 80px),
          radial-gradient(at var(--x2) var(--y2), #7c3aed 0px, transparent 80px),
          radial-gradient(at var(--x3) var(--y3), #0f172a 0px, transparent 80px),
          #0f172a
        `,
      }}
    >
      {fragments.map(fragment => (
        <motion.div
          key={fragment.id}
          className="absolute rounded-full bg-gold opacity-70"
          style={{
            width: fragment.size,
            height: fragment.size,
            left: `${fragment.x}%`,
            top: `${fragment.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, -10, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: fragment.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default dynamic(() => Promise.resolve(ConstellationBackground), { ssr: false });