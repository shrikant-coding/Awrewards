"use client";

import React from "react";

interface DayData {
  date: string;
  count: number;
  dateObj: Date;
}

interface StreakCalendarProps {
  loginHistory: Record<string, number>;
}

export default function StreakCalendar({ loginHistory }: StreakCalendarProps) {
  // Generate last 365 days
  const days: DayData[] = [];
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().slice(0, 10);
    const count = loginHistory[dateKey] || 0;
    days.push({
      date: dateKey,
      count,
      dateObj: date
    });
  }

  // Group days into weeks (7 days per week)
  const weeks: DayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get color intensity based on login count
  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-glass';
    if (count === 1) return 'bg-green-900';
    if (count <= 3) return 'bg-green-700';
    if (count <= 5) return 'bg-green-500';
    return 'bg-green-300';
  };

  // Get month labels
  const getMonthLabels = () => {
    const months = new Set<string>();
    weeks.forEach(week => {
      week.forEach(day => {
        const month = day.dateObj.toLocaleDateString('en-US', { month: 'short' });
        if (day.dateObj.getDate() <= 7) { // First week of month
          months.add(month);
        }
      });
    });
    return Array.from(months);
  };

  const monthLabels = getMonthLabels();
  const weekdays = ['Mon', 'Wed', 'Fri'];

  return (
    <div className="p-6 rounded-lg glass">
      <h3 className="text-lg font-semibold text-textPrimary mb-4">Activity Heatmap</h3>

      <div className="flex gap-2 text-xs text-textSecondary mb-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-glass"></div>
          <div className="w-3 h-3 rounded-sm bg-green-900"></div>
          <div className="w-3 h-3 rounded-sm bg-green-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <div className="w-3 h-3 rounded-sm bg-green-300"></div>
        </div>
        <span>More</span>
      </div>

      <div className="grid grid-cols-53 gap-1">
        {/* Month labels */}
        <div className="col-span-53 grid grid-cols-53 gap-1 mb-2">
          {monthLabels.map((month, index) => {
            const weekIndex = Math.floor((index * 52) / monthLabels.length);
            return (
              <div key={month} className={`text-xs text-textSecondary col-start-${weekIndex + 1}`}>
                {month}
              </div>
            );
          })}
        </div>

        {/* Weekday labels */}
        <div className="flex flex-col gap-1 mr-2">
          {weekdays.map((day, index) => (
            <div key={day} className="text-xs text-textSecondary h-3 leading-3">
              {index === 0 && day}
              {index === 1 && day}
              {index === 2 && day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-52 gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} hover:ring-1 hover:ring-accent transition-all duration-150`}
                  title={`${day.date}: ${day.count} login${day.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}