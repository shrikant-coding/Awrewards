"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface MemoryGridProps {
  cards: string[];
  onComplete: () => void;
}

export default function MemoryGrid({ cards, onComplete }: MemoryGridProps) {
  const [flipped, setFlipped] = useState<boolean[]>(new Array(cards.length).fill(false));
  const [matched, setMatched] = useState<boolean[]>(new Array(cards.length).fill(false));
  const [selected, setSelected] = useState<number[]>([]);
  const [canFlip, setCanFlip] = useState(true);

  useEffect(() => {
    if (selected.length === 2) {
      setCanFlip(false);
      const [first, second] = selected;
      if (cards[first] === cards[second]) {
        // Match
        setMatched(prev => {
          const newMatched = [...prev];
          newMatched[first] = true;
          newMatched[second] = true;
          return newMatched;
        });
        setSelected([]);
        setCanFlip(true);
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setFlipped(prev => {
            const newFlipped = [...prev];
            newFlipped[first] = false;
            newFlipped[second] = false;
            return newFlipped;
          });
          setSelected([]);
          setCanFlip(true);
        }, 1000);
      }
    }
  }, [selected, cards]);

  useEffect(() => {
    if (matched.every(m => m)) {
      onComplete();
    }
  }, [matched, onComplete]);

  function handleCardClick(index: number) {
    if (!canFlip || flipped[index] || matched[index] || selected.length >= 2) return;
    setFlipped(prev => {
      const newFlipped = [...prev];
      newFlipped[index] = true;
      return newFlipped;
    });
    setSelected(prev => [...prev, index]);
  }

  return (
    <div className="grid grid-cols-4 gap-2 w-80 mx-auto glass p-4 rounded-lg">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className="w-16 h-16 cursor-pointer perspective-1000"
          onClick={() => handleCardClick(index)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="relative w-full h-full transform-style-preserve-3d"
            initial={false}
            animate={{ rotateY: flipped[index] || matched[index] ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
          >
            {/* Back of card */}
            <div className="absolute inset-0 w-full h-full backface-hidden glass rounded-lg flex items-center justify-center border-2 border-accent">
              <span className="text-2xl text-textPrimary">?</span>
            </div>
            {/* Front of card */}
            <div className="absolute inset-0 w-full h-full backface-hidden glass rounded-lg flex items-center justify-center transform rotate-y-180 border-2 border-accent">
              <span className="text-2xl text-textPrimary">{card}</span>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}