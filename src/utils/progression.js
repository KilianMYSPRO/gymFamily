import { normalizeExercise } from './exerciseNormalization';

/**
 * Calculates the suggested weight for an exercise based on the user's history.
 * Implements a simple Linear Progression model:
 * - If the last session was fully completed (all sets, full reps), increase weight.
 * - Otherwise, maintain weight.
 * 
 * @param {string} exerciseName - The name of the exercise.
 * @param {Array} history - The user's workout history array.
 * @param {number} increment - The weight to add if progression is met (default 2.5).
 * @returns {number|null} The suggested weight, or null if no history found.
 */
export const getSuggestedWeight = (exerciseName, history, increment = 2.5) => {
    if (!history || history.length === 0) return null;

    const targetNormalized = normalizeExercise(exerciseName);
    // console.log(`[Progression] Analyzing: "${exerciseName}" (Normalized: "${targetNormalized}")`);

    const sortedHistory = [...history].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

    // Find the first VALID session (has sets)
    let lastSession = null;
    let lastExerciseData = null;

    for (const session of sortedHistory) {
        if (!session.exercises) continue;

        const exData = session.exercises.find(ex => normalizeExercise(ex.name) === targetNormalized);

        if (exData && exData.sets && exData.sets.length > 0) {
            lastSession = session;
            lastExerciseData = exData;
            break; // Found a valid one
        }
    }

    if (!lastSession || !lastExerciseData) {
        return null;
    }

    // 2. Check if all sets were completed
    const allSetsCompleted = lastExerciseData.sets.every(set => set.completed);

    // 3. Determine the weight used in the last session
    const lastSet = lastExerciseData.sets[lastExerciseData.sets.length - 1];
    let weightStr = lastSet.weight;
    if (typeof weightStr !== 'string') weightStr = String(weightStr || '');

    const lastWeight = parseFloat(weightStr.replace(',', '.'));

    if (isNaN(lastWeight)) {
        return null;
    }

    // 4. Calculate suggestion
    if (allSetsCompleted) {
        return lastWeight + increment;
    } else {
        return lastWeight;
    }
};
