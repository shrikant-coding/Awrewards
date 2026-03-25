"use client";

import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

export default function CrosswordGrid({
  solution,
  initialAnswers = [],
  onChange,
}: {
  solution: string[];
  initialAnswers?: string[];
  onChange?: (answers: string[], completed: boolean) => void;
}) {
  const size = 5;
  const total = size * size;
  const [answers, setAnswers] = useState<string[]>(() => {
    const arr = Array(total).fill("");
    initialAnswers.forEach((v, i) => (arr[i] = v || ""));
    return arr;
  });

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const isCompleted = answers.every((a, i) => a.toUpperCase() === (solution[i] || ""));
    if (isCompleted && !completed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    setCompleted(isCompleted);
    onChange?.(answers, isCompleted);
  }, [answers, solution, onChange, completed]);

  function focusCell(index: number) {
    const el = inputsRef.current[index];
    if (el) el.focus();
  }

  function handleChange(index: number, value: string) {
    const ch = value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(-1);
    setAnswers(prev => {
      const next = [...prev];
      next[index] = ch;
      return next;
    });
    if (ch) focusCell(Math.min(index + 1, total - 1));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!answers[index]) focusCell(Math.max(0, index - 1));
      setAnswers(prev => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
    } else if (e.key === "ArrowLeft") focusCell(Math.max(0, index - 1));
    else if (e.key === "ArrowRight") focusCell(Math.min(total - 1, index + 1));
    else if (e.key === "ArrowUp") focusCell(Math.max(0, index - size));
    else if (e.key === "ArrowDown") focusCell(Math.min(total - 1, index + size));
  }

  return (
    <div className="grid grid-cols-5 gap-1 w-full max-w-md glass p-4 rounded-lg">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="relative">
          <input
            ref={el => { inputsRef.current[i] = el; }}
            value={answers[i] || ""}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            maxLength={1}
            className="w-full h-14 text-center text-lg font-bold glass border-2 border-glass rounded-md focus:outline-none focus:border-accent focus:glow-text transition-all duration-150"
            inputMode="text"
          />
          {/* optional small clue index */}
        </div>
      ))}
    </div>
  );
}