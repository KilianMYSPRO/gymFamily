export const LEVELS = [
    { name: "Rookie", minWorkouts: 0, color: "text-slate-400", icon: "🌱" },
    { name: "Regular", minWorkouts: 10, color: "text-emerald-400", icon: "🌿" },
    { name: "Gym Rat", minWorkouts: 50, color: "text-blue-400", icon: "🐀" },
    { name: "Iron Addict", minWorkouts: 100, color: "text-purple-400", icon: "💪" },
    { name: "Titan", minWorkouts: 250, color: "text-amber-400", icon: "⚡" },
    { name: "Legend", minWorkouts: 500, color: "text-red-500", icon: "👑" }
];

// Configuration constants
const MAX_REST_DAYS_FOR_STREAK = 4;
const MOMENTUM_WINDOW_DAYS = 14;
const MOMENTUM_TARGET_WORKOUTS = 6;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Validates a history entry has a valid endTime
 */
const isValidHistoryEntry = (entry) => {
    if (!entry?.endTime) return false;
    const date = new Date(entry.endTime);
    return !isNaN(date.getTime());
};

export const calculateGamificationStats = (history) => {
    // Filter to only valid entries with parseable dates
    const validHistory = Array.isArray(history)
        ? history.filter(isValidHistoryEntry)
        : [];

    if (validHistory.length === 0) {
        return {
            level: LEVELS[0],
            nextLevel: LEVELS[1],
            progress: 0,
            streak: 0,
            momentum: 0,
            totalWorkouts: 0
        };
    }

    const totalWorkouts = validHistory.length;

    // 1. Calculate Level
    let currentLevelIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (totalWorkouts >= LEVELS[i].minWorkouts) {
            currentLevelIndex = i;
            break;
        }
    }
    const level = LEVELS[currentLevelIndex];
    const nextLevel = LEVELS[currentLevelIndex + 1] || { ...level, minWorkouts: totalWorkouts * 2 };

    // Progress to next level
    const workoutsInLevel = totalWorkouts - level.minWorkouts;
    const workoutsNeeded = nextLevel.minWorkouts - level.minWorkouts;
    const progress = Math.min(100, Math.max(0, (workoutsInLevel / workoutsNeeded) * 100));

    // 2. Calculate Streak
    let currentStreak = 0;
    const sortedHistory = [...validHistory].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

    const now = new Date();
    const lastWorkout = new Date(sortedHistory[0].endTime);
    const daysSinceLast = (now - lastWorkout) / MS_PER_DAY;

    if (daysSinceLast < MAX_REST_DAYS_FOR_STREAK) {
        currentStreak = 1;
        for (let i = 0; i < sortedHistory.length - 1; i++) {
            const d1 = new Date(sortedHistory[i].endTime);
            const d2 = new Date(sortedHistory[i + 1].endTime);
            const gap = (d1 - d2) / MS_PER_DAY;

            if (gap < MAX_REST_DAYS_FOR_STREAK) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // 3. Momentum Score (0-100)
    const recentWorkouts = validHistory.filter(s => {
        const diff = now - new Date(s.endTime);
        return diff < MOMENTUM_WINDOW_DAYS * MS_PER_DAY;
    }).length;

    const momentum = Math.min(100, (recentWorkouts / MOMENTUM_TARGET_WORKOUTS) * 100);

    return {
        level,
        nextLevel,
        progress,
        streak: currentStreak,
        momentum,
        totalWorkouts
    };
};
