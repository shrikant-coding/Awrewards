"use client";

import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface SudokuGridProps {
  puzzle: (number | null)[][];
  initialAnswers: (number | null)[][];
  onChange: (answers: (number | null)[][], completed: boolean) => void;
}

export default function SudokuGrid({ puzzle, initialAnswers = [], onChange }: SudokuGridProps) {
  const size = 4;
  const [answers, setAnswers] = useState<(number | null)[][]>(() => {
    const grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null as number | null)
    );
    initialAnswers.forEach((row, r) =>
      row.forEach((val, c) => {
        if (val !== null) grid[r][c] = val;
      })
    );
    return grid;
  });
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check completion
    let isCompleted = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (answers[r][c] !== puzzle[r][c]) {
          isCompleted = false;
          break;
        }
      }
      if (!isCompleted) break;
    }
    if (isCompleted && !completed) {
      // Just completed, trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    setCompleted(isCompleted);
    onChange(answers, isCompleted);
  }, [answers, puzzle, onChange, completed]);

  function isValidMove(r: number, c: number, num: number): boolean {
    // Check row
    for (let col = 0; col < size; col++) {
      if (answers[r][col] === num && col !== c) return false;
    }
    // Check column
    for (let row = 0; row < size; row++) {
      if (answers[row][c] === num && row !== r) return false;
    }
    // Check 2x2 box
    const boxRowStart = Math.floor(r / 2) * 2;
    const boxColStart = Math.floor(c / 2) * 2;
    for (let br = boxRowStart; br < boxRowStart + 2; br++) {
      for (let bc = boxColStart; bc < boxColStart + 2; bc++) {
        if (answers[br][bc] === num && (br !== r || bc !== c)) return false;
      }
    }
    return true;
  }

  function handleCellClick(r: number, c: number) {
    setSelected({ r, c });
    setWheelOpen(true);
  }

  function selectNumber(num: number | null) {
    if (!selected) return;
    const { r, c } = selected;
    if (puzzle[r][c] !== null) return; // Don't overwrite given cells
    if (num !== null && !isValidMove(r, c, num)) return;
    setAnswers(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = num;
      return newGrid;
    });
    setWheelOpen(false);
  }

  function handleDragStart(e: React.DragEvent, num: number) {
    e.dataTransfer.setData('text/plain', num.toString());
  }

  function handleDrop(e: React.DragEvent, r: number, c: number) {
    e.preventDefault();
    const num = parseInt(e.dataTransfer.getData('text/plain'));
    if (puzzle[r][c] !== null) return;
    if (!isValidMove(r, c, num)) return;
    setAnswers(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = num;
      return newGrid;
    });
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  const wheelNumbers = [1, 2, 3, 4];

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-1 w-80 mx-auto glass p-4 rounded-lg" ref={gridRef}>
        {answers.map((row, r) =>
          row.map((cell, c) => {
            const isGiven = puzzle[r][c] !== null;
            const isSelected = selected?.r === r && selected?.c === c;
            const isInvalid = cell !== null && !isValidMove(r, c, cell);
            return (
              <div
                key={`${r}-${c}`}
                className={`w-16 h-16 border-2 flex items-center justify-center text-xl font-bold cursor-pointer select-none transition-all duration-150 hover:scale-105
                  ${isGiven ? 'bg-glass text-textPrimary' : 'bg-glass text-accent'}
                  ${isSelected ? 'border-accent glow-text' : 'border-glass'}
                  ${isInvalid ? 'text-red-400 shake' : ''}
                  ${(c + 1) % 2 === 0 ? 'border-r-glass' : ''}
                  ${(r + 1) % 2 === 0 ? 'border-b-glass' : ''}`}
                onClick={() => handleCellClick(r, c)}
                onDrop={(e) => handleDrop(e, r, c)}
                onDragOver={handleDragOver}
              >
                {cell || ''}
              </div>
            );
          })
        )}
      </div>

      {/* Number Wheel */}
      {wheelOpen && selected && (
        <div className="absolute inset-0 flex items-center justify-center glass z-10 rounded-lg p-4">
          <div className="glass p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {wheelNumbers.map(num => (
                <button
                  key={num}
                  className="w-12 h-12 bg-gradient-to-r from-primaryFrom to-primaryTo text-textPrimary rounded-full flex items-center justify-center text-lg font-bold hover:scale-110 transition-transform duration-150 ripple"
                  onClick={() => selectNumber(num)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              className="w-full glass text-textPrimary py-2 rounded hover:gradient-border transition-all duration-150"
              onClick={() => selectNumber(null)}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Draggable numbers at bottom */}
      <div className="mt-4 flex justify-center gap-2">
        {wheelNumbers.map(num => (
          <div
            key={num}
            className="w-12 h-12 bg-gradient-to-r from-primaryFrom to-primaryTo text-textPrimary rounded-full flex items-center justify-center text-lg font-bold cursor-move hover:scale-110 transition-transform duration-150"
            draggable
            onDragStart={(e) => handleDragStart(e, num)}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}