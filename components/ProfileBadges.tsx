"use client";

import React from "react";

interface ProfileBadgesProps {
  streakCount: number;
  totalFragments: number;
}

export default function ProfileBadges({ streakCount, totalFragments }: ProfileBadgesProps) {
  const badges = [
    {
      id: 'streak_3',
      name: '3-Day Streak',
      icon: '🔥',
      earned: streakCount >= 3,
      color: 'text-orange-500'
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      icon: '💪',
      earned: streakCount >= 7,
      color: 'text-blue-500'
    },
    {
      id: 'streak_30',
      name: 'Monthly Master',
      icon: '👑',
      earned: streakCount >= 30,
      color: 'text-purple-500'
    },
    {
      id: 'fragments_10',
      name: 'Fragment Collector',
      icon: '💎',
      earned: totalFragments >= 10,
      color: 'text-green-500'
    },
    {
      id: 'fragments_50',
      name: 'Treasure Hunter',
      icon: '🏆',
      earned: totalFragments >= 50,
      color: 'text-yellow-500'
    }
  ];

  const earnedBadges = badges.filter(badge => badge.earned);
  const unearnedBadges = badges.filter(badge => !badge.earned);

  return (
    <div className="p-6 rounded-lg glass">
      <h3 className="text-lg font-semibold text-textPrimary mb-4">Profile Badges</h3>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-textSecondary mb-2">Earned</h4>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map(badge => (
              <div
                key={badge.id}
                className="flex items-center gap-2 p-2 rounded-lg glass border border-accent"
                title={badge.name}
              >
                <span className={`text-lg ${badge.color}`}>{badge.icon}</span>
                <span className="text-sm text-textPrimary">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unearned Badges */}
      {unearnedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-textSecondary mb-2">Locked</h4>
          <div className="flex flex-wrap gap-2">
            {unearnedBadges.map(badge => (
              <div
                key={badge.id}
                className="flex items-center gap-2 p-2 rounded-lg glass opacity-50"
                title={`${badge.name} - Locked`}
              >
                <span className="text-lg text-textSecondary">🔒</span>
                <span className="text-sm text-textSecondary">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}