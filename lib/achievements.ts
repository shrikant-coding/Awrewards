import toast from "react-hot-toast";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function triggerAchievement(achievement: Achievement) {
  toast.success(`${achievement.icon} ${achievement.title} - ${achievement.description}`, {
    duration: 5000,
    style: {
      background: '#1e293b',
      color: '#f1f5f9',
      border: '1px solid #334155',
    },
  });
}

export function checkAchievements(userDoc: any, todayProgress: any): Achievement[] {
  const achievementDefs = [
    {
      id: 'first_login',
      title: 'Welcome!',
      description: 'First time logging in',
      icon: '👋',
      condition: () => true, // Always unlocked for logged in users
    },
    {
      id: 'streak_3',
      title: 'Getting Started',
      description: '3 day streak',
      icon: '🔥',
      condition: () => (userDoc?.streakCount || 0) >= 3,
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: '7 day streak',
      icon: '💪',
      condition: () => (userDoc?.streakCount || 0) >= 7,
    },
    {
      id: 'streak_30',
      title: 'Monthly Master',
      description: '30 day streak',
      icon: '👑',
      condition: () => (userDoc?.streakCount || 0) >= 30,
    },
    {
      id: 'first_puzzle',
      title: 'Puzzle Solver',
      description: 'Completed your first puzzle',
      icon: '🧩',
      condition: () => (todayProgress?.solvedPuzzles?.length || 0) >= 1,
    },
    {
      id: 'all_puzzles',
      title: 'Puzzle Master',
      description: 'Completed all daily puzzles',
      icon: '🏆',
      condition: () => (todayProgress?.solvedPuzzles?.length || 0) >= 3,
    },
    {
      id: 'first_code',
      title: 'Code Hunter',
      description: 'Claimed your first reward code',
      icon: '🎁',
      condition: () => (userDoc?.totalCodes || 0) >= 1,
    },
  ];

  return achievementDefs
    .filter(def => def.condition())
    .map(def => ({ ...def, unlocked: true }));
}