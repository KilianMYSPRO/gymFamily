import exercisesData from '../data/exercises.json';

const EXERCISE_ALIASES = {
    "Leg press (machine)": "Leg Press",
    "Leg Press (Machine)": "Leg Press",
    "Leg press": "Leg Press"
};

const SYNONYMS = {
    "dumbbells": "dumbbell",
    "db": "dumbbell",
    "barbells": "barbell",
    "bb": "barbell",
    "kb": "kettlebell",
    "kettlebells": "kettlebell",
    "bw": "bodyweight",
    "body": "bodyweight",
    // "weight bar" and "smith machine" are handled in pre-processing
};

const STOP_WORDS = new Set(["with", "using", "the", "a", "an", "on"]);

/**
 * Generates a normalized fingerprint for an exercise name.
 * Lowercases, removes punctuation, handles synonyms, removes stop words, and sorts tokens.
 */
const getFingerprint = (name) => {
    if (!name) return "";

    let processed = name.toLowerCase();

    // Remove punctuation
    processed = processed.replace(/[()\-,.]/g, " ");

    // Handle multi-word synonyms
    processed = processed.replace(/weight bar/g, "barbell");
    processed = processed.replace(/smith machine/g, "smith");

    const tokens = processed.split(/\s+/).filter(t => t.length > 0);

    const mappedTokens = tokens.map(t => SYNONYMS[t] || t)
        .filter(t => !STOP_WORDS.has(t));

    return mappedTokens.sort().join(" ");
};

// Pre-compute fingerprints for all canonical exercises
// We use a Map to store the first canonical name found for a fingerprint
const FINGERPRINT_MAP = {};
exercisesData.forEach(ex => {
    const fp = getFingerprint(ex.name);
    if (fp && !FINGERPRINT_MAP[fp]) {
        FINGERPRINT_MAP[fp] = ex.name;
    }
});

/**
 * Normalizes an exercise name to a canonical version.
 * 1. If originalId is provided, looks up the name in the master exercise list.
 * 2. Checks against a hardcoded list of aliases.
 * 3. Checks against token fingerprints (handling synonyms and reordering).
 * 4. Returns the original name if no match is found.
 * 
 * @param {string} name - The name of the exercise
 * @param {string|null} originalId - The ID of the exercise from the master list (optional)
 * @returns {string} The normalized exercise name
 */
export const normalizeExercise = (name, originalId = null) => {
    // 1. Try to resolve by ID first if available
    if (originalId) {
        const match = exercisesData.find(ex => ex.id === originalId);
        if (match) return match.name;
    }

    // 2. Check explicit aliases
    if (EXERCISE_ALIASES[name]) {
        return EXERCISE_ALIASES[name];
    }

    // 3. Check fingerprint
    const fp = getFingerprint(name);
    if (FINGERPRINT_MAP[fp]) {
        return FINGERPRINT_MAP[fp];
    }

    // 4. Return original name if no normalization found
    return name;
};
