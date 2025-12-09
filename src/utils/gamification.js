export const LEVELS = [
    { name: "Rookie", minWorkouts: 0, color: "text-slate-400", icon: "🌱" },
    { name: "Regular", minWorkouts: 10, color: "text-emerald-400", icon: "🌿" },
    { name: "Gym Rat", minWorkouts: 50, color: "text-blue-400", icon: "🐀" },
    { name: "Iron Addict", minWorkouts: 100, color: "text-purple-400", icon: "💪" },
    { name: "Titan", minWorkouts: 250, color: "text-amber-400", icon: "⚡" },
    { name: "Legend", minWorkouts: 500, color: "text-red-500", icon: "👑" }
];

export const calculateGamificationStats = (history) => {
    if (!history || history.length === 0) {
        return {
            level: LEVELS[0],
            nextLevel: LEVELS[1],
            progress: 0,
            streak: 0,
            momentum: 0,
            totalWorkouts: 0
        };
    }

    const totalWorkouts = history.length;

    // 1. Calculate Level
    let currentLevelIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (totalWorkouts >= LEVELS[i].minWorkouts) {
            currentLevelIndex = i;
            break;
        }
    }
    const level = LEVELS[currentLevelIndex];
    const nextLevel = LEVELS[currentLevelIndex + 1] || { ...level, minWorkouts: totalWorkouts * 2 }; // Cap if max level

    // Progress to next level
    const workoutsInLevel = totalWorkouts - level.minWorkouts;
    const workoutsNeeded = nextLevel.minWorkouts - level.minWorkouts;
    const progress = Math.min(100, Math.max(0, (workoutsInLevel / workoutsNeeded) * 100));

    // 2. Calculate Streak
    // Logic: "Current Streak" based on days gap < 4 days
    // If gap between workouts is > 4 days, streak resets.
    let currentStreak = 0;
    if (history.length > 0) {
        // Sort by date descending
        const sortedHistory = [...history].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

        const now = new Date();
        const lastWorkout = new Date(sortedHistory[0].endTime);
        const daysSinceLast = (now - lastWorkout) / (1000 * 60 * 60 * 24);

        if (daysSinceLast < 4) {
            currentStreak = 1;
            for (let i = 0; i < sortedHistory.length - 1; i++) {
                const d1 = new Date(sortedHistory[i].endTime);
                const d2 = new Date(sortedHistory[i + 1].endTime);
                const gap = (d1 - d2) / (1000 * 60 * 60 * 24);

                if (gap < 4) { // Allow up to 3 rest days
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }

    // 3. Momentum Score (0-100)
    // Based on frequency in last 14 days
    const recentWorkouts = history.filter(s => {
        const diff = new Date() - new Date(s.endTime);
        return diff < 14 * 24 * 60 * 60 * 1000;
    }).length;

    // Cap at 8 workouts in 2 weeks (4x/week) = 100% momentum
    const momentum = Math.min(100, (recentWorkouts / 8) * 100);

    return {
        level,
        nextLevel,
        progress,
        streak: currentStreak,
        momentum,
        totalWorkouts
    };
};
