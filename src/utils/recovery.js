import exercisesData from '../data/exercises.json';
import { normalizeExercise } from './exerciseNormalization';

// Map specific muscles to broader groups if needed, or keep them specific
// These keys should match the IDs in the SVG component
const MUSCLE_MAPPING = {
    "abdominals": "abs",
    "hamstrings": "hamstrings",
    "calves": "calves",
    "pectorals": "chest",
    "triceps": "triceps",
    "biceps": "biceps",
    "shoulders": "shoulders",
    "lats": "lats",
    "middle back": "upper_back",
    "lower back": "lower_back",
    "traps": "traps",
    "quadriceps": "quads",
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

    console.log('[Recovery] Recent history:', recentHistory);

    recentHistory.forEach(session => {
        if (!session.exercises) return;

        const sessionDate = new Date(session.endTime);
        const diffTime = Math.abs(now - sessionDate);
        const daysAgo = diffTime / (1000 * 60 * 60 * 24); // Floating point days

        console.log(`[Recovery] Processing session from ${daysAgo.toFixed(1)} days ago`);

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

            if (!exerciseDef) {
                console.warn(`[Recovery] Could not find definition for: "${ex.name}"`);
                return;
            }

            // Calculate "Strain"
            // Simple model: 1 set = 10 fatigue points
            // We could use volume (weight * reps), but that requires knowing 1RM.
            // Set count is a decent proxy for volume load.
            const sets = ex.sets ? ex.sets.length : 0;
            const strain = sets * 15; // Arbitrary: 3 sets = 45 fatigue

            console.log(`[Recovery] Exercise: ${ex.name}, Sets: ${sets}, Strain: ${strain}`);

            // Apply to Primary Muscles (100% impact)
            if (exerciseDef.primaryMuscles) {
                exerciseDef.primaryMuscles.forEach(muscle => {
                    const mapped = MUSCLE_MAPPING[muscle] || muscle;
                    const decayedStrain = strain * Math.pow(0.5, daysAgo / 2); // Half-life of 2 days
                    fatigueMap[mapped] = (fatigueMap[mapped] || 0) + decayedStrain;
                    console.log(`  -> Primary: ${muscle} (mapped: ${mapped}) += ${decayedStrain.toFixed(1)}`);
                });
            }

            // Apply to Secondary Muscles (50% impact)
            if (exerciseDef.secondaryMuscles) {
                exerciseDef.secondaryMuscles.forEach(muscle => {
                    const mapped = MUSCLE_MAPPING[muscle] || muscle;
                    const decayedStrain = strain * 0.5 * Math.pow(0.5, daysAgo / 2);
                    fatigueMap[mapped] = (fatigueMap[mapped] || 0) + decayedStrain;
                    console.log(`  -> Secondary: ${muscle} (mapped: ${mapped}) += ${decayedStrain.toFixed(1)}`);
                });
            }
        });
    });

    console.log('[Recovery] Final Fatigue Map:', fatigueMap);

    // Convert Fatigue to Recovery (0-100)
    const recoveryMap = {};
    Object.keys(fatigueMap).forEach(muscle => {
        // Cap fatigue at 100
        const fatigue = Math.min(fatigueMap[muscle], 100);
        recoveryMap[muscle] = Math.round(100 - fatigue);
    });

    return recoveryMap;
};
