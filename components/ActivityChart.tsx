"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface ActivityLogs {
  [date: string]: {
    open_count?: number;
    total_minutes?: number;
  };
}

interface ActivityChartProps {
  activityLogs: ActivityLogs;
}

export default function ActivityChart({ activityLogs }: ActivityChartProps) {
  // Get last 7 days
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().slice(0, 10);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const opens = activityLogs[dateKey]?.open_count || 0;
    const minutes = activityLogs[dateKey]?.total_minutes || 0;
    days.push({
      day: dayName,
      date: dateKey,
      usage: minutes,
      opens: opens
    });
  }

  const maxUsage = Math.max(...days.map(d => d.usage), 1);
  const maxOpens = Math.max(...days.map(d => d.opens), 1);

  return (
    <div className="p-6 rounded-lg glass">
      <h3 className="text-lg font-semibold text-textPrimary mb-4">Activity Dashboard</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Usage Time - Line Chart */}
        <div>
          <h4 className="text-md font-semibold text-textPrimary mb-2">Daily Usage Time (Minutes)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="day"
                stroke="#888"
                fontSize={12}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                domain={[0, maxUsage]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#00ffff"
                strokeWidth={3}
                dot={{ fill: '#00ffff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#00ffff', strokeWidth: 2 }}
                fill="#00ffff"
                fillOpacity={0.3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* App Opens - Bar Chart */}
        <div>
          <h4 className="text-md font-semibold text-textPrimary mb-2">App Opens</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="day"
                stroke="#888"
                fontSize={12}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                domain={[0, maxOpens]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar
                dataKey="opens"
                fill="#32cd32"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}