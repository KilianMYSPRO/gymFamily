import exercisesData from '../data/exercises.json';
import { normalizeExercise } from './exerciseNormalization';

// Map specific muscles to broader groups if needed, or keep them specific
// These keys should match the IDs in the SVG component
const MUSCLE_MAPPING = {
    "abdominals": "abs",
    "abs": "abs",
    "hamstrings": "hamstrings",
    "calves": "calves",
    "pectorals": "chest",
    "chest": "chest",
    "triceps": "triceps",
    "biceps": "biceps",
    "shoulders": "shoulders",
    "lats": "lats",
    "middle back": "upper_back",
    "lower back": "lower_back",
    "traps": "traps",
    "quadriceps": "quads",
    "quads": "quads",
    "glutes": "glutes",
    "forearms": "forearms",
    "adductors": "legs_inner",
    "abductors": "legs_outer",
    "neck": "neck"
};

/**
 * Calculates recovery percentage for each muscle group.
 * Returns object: { "chest": 100, "legs": 50, ... }
 * 100 = Fully Recovered (Green)
 * 0 = Fully Fatigued (Red)
 */
export const calculateRecovery = (history) => {
    if (!history || history.length === 0) return {};

    const now = new Date();
    const fatigueMap = {}; // muscle -> fatigue score (0-100+)

    // Initialize all muscles to 0 fatigue
    Object.values(MUSCLE_MAPPING).forEach(m => fatigueMap[m] = 0);

    // Analyze last 7 days
    const recentHistory = history.filter(session => {
        const sessionDate = new Date(session.endTime);
        const diffTime = Math.abs(now - sessionDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    });

    recentHistory.forEach(session => {
        if (!session.exercises) return;

        const sessionDate = new Date(session.endTime);
        const diffTime = Math.abs(now - sessionDate);
        const daysAgo = diffTime / (1000 * 60 * 60 * 24); // Floating point days

        session.exercises.forEach(ex => {
            // Find exercise data
            // 1. Try by originalId
            // 2. Try by normalized name
            let exerciseDef = null;
            if (ex.originalId) {
                exerciseDef = exercisesData.find(e => e.id === ex.originalId);
            }
            if (!exerciseDef) {
                const normalizedName = normalizeExercise(ex.name);
                exerciseDef = exercisesData.find(e => e.name === normalizedName);
            }

            // Fallback: Infer muscles from name keywords (Robustness for custom/translated names)
            if (!exerciseDef) {
                const lowerName = ex.name.toLowerCase();
                const inferredMuscles = [];
                const inferredSecondary = [];

                if (lowerName.includes("bench") || lowerName.includes("chest") || lowerName.includes("couché") || lowerName.includes("pectoraux")) inferredMuscles.push("chest");
                if (lowerName.includes("squat") || lowerName.includes("leg press") || lowerName.includes("cuisses")) inferredMuscles.push("quads");
                if (lowerName.includes("deadlift") || lowerName.includes("row") || lowerName.includes("pull") || lowerName.includes("dos") || lowerName.includes("tirage")) inferredMuscles.push("lats");
                if (lowerName.includes("shoulder") || lowerName.includes("military") || lowerName.includes("press") || lowerName.includes("latérales") || lowerName.includes("militaire") || lowerName.includes("écarté")) inferredMuscles.push("shoulders");
                if (lowerName.includes("curl") || lowerName.includes("biceps")) inferredMuscles.push("biceps");
                if (lowerName.includes("triceps") || lowerName.includes("extension") || lowerName.includes("barre front") || lowerName.includes("dips")) inferredMuscles.push("triceps");
                if (lowerName.includes("abs") || lowerName.includes("crunch") || lowerName.includes("sit-up") || lowerName.includes("gainage")) inferredMuscles.push("abs");

                if (inferredMuscles.length > 0) {
                    exerciseDef = {
                        primaryMuscles: inferredMuscles,
                        secondaryMuscles: inferredSecondary
                    };
                }
            }

            if (!exerciseDef) {
                console.warn(`Could not identify muscles for exercise: ${ex.name}`);
                return;
            }

            // Calculate "Strain"
            // Simple model: 1 set = 10 fatigue points
            // We could use volume (weight * reps), but that requires knowing 1RM.
            // Set count is a decent proxy for volume load.
            const sets = ex.sets ? ex.sets.length : 0;
            const strain = sets * 15; // Arbitrary: 3 sets = 45 fatigue

            // Apply to Primary Muscles (100% impact)
            if (exerciseDef.primaryMuscles) {
                exerciseDef.primaryMuscles.forEach(muscle => {
                    const mapped = MUSCLE_MAPPING[muscle] || muscle;
                    const decayedStrain = strain * Math.pow(0.5, daysAgo / 2); // Half-life of 2 days
                    fatigueMap[mapped] = (fatigueMap[mapped] || 0) + decayedStrain;
                });
            }

            // Apply to Secondary Muscles (50% impact)
            if (exerciseDef.secondaryMuscles) {
                exerciseDef.secondaryMuscles.forEach(muscle => {
                    const mapped = MUSCLE_MAPPING[muscle] || muscle;
                    const decayedStrain = strain * 0.5 * Math.pow(0.5, daysAgo / 2);
                    fatigueMap[mapped] = (fatigueMap[mapped] || 0) + decayedStrain;
                });
            }
        });
    });

    // Convert Fatigue to Recovery (0-100)
    const recoveryMap = {};
    Object.keys(fatigueMap).forEach(muscle => {
        // Cap fatigue at 100
        const fatigue = Math.min(fatigueMap[muscle], 100);
        recoveryMap[muscle] = Math.round(100 - fatigue);
    });

    return recoveryMap;
};
