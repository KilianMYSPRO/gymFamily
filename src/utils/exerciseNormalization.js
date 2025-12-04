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
    "haltères": "dumbbell",
    "halteres": "dumbbell",
    "barre": "barbell",
    "poids": "bodyweight"
};

const CUSTOM_MAPPINGS = {
    // French mappings
    "Développé Couché (Haltères ou Machine)": "Barbell Bench Press - Medium Grip",
    "Développé Couché": "Barbell Bench Press - Medium Grip",
    "Développé Militaire Assis (Haltères ou Machine)": "Seated Barbell Military Press",
    "Développé Militaire": "Military Press",
    "Écarté Poulie Vis-à-vis (Cable Fly)": "Cable Crossover",
    "Écarté Poulie": "Cable Crossover",
    "Élévations Latérales (Haltères ou Poulie)": "Side Lateral Raise",
    "Élévations Latérales": "Side Lateral Raise",
    "Curl Incliné (Haltères)": "Incline Dumbbell Curl",
    "Curl Pupitre (Machine)": "Preacher Curl",
    "Enroulement de Bassin": "Hanging Leg Raise", // Approximation
    "Leg Extension (Machine)": "Leg Extensions",
    "Presse à Cuisses (Machine)": "Leg Press",
    "Leg Curl Assis (Machine)": "Seated Leg Curl",
    "Mollets Debout (Machine)": "Standing Calf Raises",
    "Tirage Vertical (Machine)": "Cable Pulldown", // Lat Pulldown
    "Tirage Horizontal (Machine)": "Seated Cable Rows",
    "Rowing Barre (T-Bar ou Yates)": "Bent Over Barbell Row",
    "Face Pull (Poulie)": "Face Pull",
    "Curl Marteau (Haltères)": "Hammer Curls",
    "Dips (Poids du corps ou Lesté)": "Dips - Chest Version",
    "Extension Triceps (Poulie)": "Triceps Pushdown",
    "Extension Triceps au-dessus de la tête (Haltère ou Câble)": "Cable Rope Overhead Triceps Extension",
    "Extension Triceps Poulie (Corde ou Barre)": "Triceps Pushdown",
    "Crunch Câble (à genoux) ou Enroulement Bassin": "Cable Crunch",
    "Leg Extension (Priorité Quadriceps)": "Leg Extensions",
    "Leg Curl Assis (Priorité Ischios)": "Seated Leg Curl",
    "Presse à Cuisses horizontale (Pieds HAUTS & Écartés)": "Leg Press",
    "Machine Adducteurs (Intérieur Cuisse)": "Adductor",
    "Machine Abducteurs (Extérieur Fessier)": "Thigh Abductor",
    "Tirage Vertical": "Wide-Grip Lat Pulldown"
};

const STOP_WORDS = new Set(["with", "using", "the", "a", "an", "on", "de", "du", "le", "la", "les", "en", "à", "au", "aux"]);

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

    // 2. Check custom mappings (exact match)
    if (CUSTOM_MAPPINGS[name]) {
        return CUSTOM_MAPPINGS[name];
    }

    // 3. Check explicit aliases
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
