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
    "Développé Couché (Haltères)": "Dumbbell Bench Press",
    "Développé Couché": "Barbell Bench Press - Medium Grip",
    "Développé Militaire Assis (Haltères ou Machine)": "Seated Barbell Military Press",
    "Développé Militaire Assis (Haltères)": "Seated Dumbbell Press",
    "Développé Militaire": "Military Press",
    "Dips Assis (Machine)": "Dips - Chest Version",
    "Écarté Poulie Vis-à-vis (Cable Fly)": "Cable Crossover",
    "Écarté Poulie Vis-à-vis": "Cable Crossover",
    "Écarté Poulie": "Cable Crossover",
    "Élévations Latérales (Haltères ou Poulie)": "Side Lateral Raise",
    "Élévations Latérales Assis (Machine)": "Side Lateral Raise",
    "Élévations Latérales": "Side Lateral Raise",
    "Overhead Triceps": "Seated Dumbbell Overhead Triceps Extension",
    "Extension Triceps Poulie (Corde)": "Triceps Pushdown - Rope Attachment",
    "Extension Triceps Poulie (Corde ou Barre)": "Triceps Pushdown",
    "Crunch Câble (À genoux)": "Cable Crunch",
    "Crunch Câble (à genoux) ou Enroulement Bassin": "Cable Crunch",
    "Leg Extension (Priorité Quadriceps)": "Leg Extensions",
    "Leg Curl Assis (Priorité Ischios)": "Seated Leg Curl",
    "Presse à Cuisses horizontale (Pieds HAUTS & Écartés)": "Leg Press",
    "Machine Adducteurs (Intérieur Cuisse)": "Adductor",
    "Machine Abducteurs (Extérieur Fessier)": "Thigh Abductor",
    "Machine Abducteurs (Extérieur Fessier)": "Thigh Abductor",
    "Tirage Vertical": "Wide-Grip Lat Pulldown",
    "Oiseau à la poulie haute": "Cable Rear Delt Fly",
    "Oiseau a la poulie haute": "Cable Rear Delt Fly",
    "Oiseau à la poulie": "Cable Rear Delt Fly",
    "Oiseau a la poulie": "Cable Rear Delt Fly",
    "Enroulement de Bassin": "Reverse Crunch",
    "Soulevé de Terre Roumain (Barre)": "Romanian Deadlift",
    "Soulevé de Terre Roumain": "Romanian Deadlift",
    "Développé Incliné (Haltères)": "Incline Dumbbell Press",
    "Développé Incliné (Halteres)": "Incline Dumbbell Press",

    // English Common Aliases
    "Bench Press": "Barbell Bench Press - Medium Grip",
    "Barbell Bench Press": "Barbell Bench Press - Medium Grip",
    "Incline Bench Press": "Barbell Incline Bench Press - Medium Grip",
    "Incline Press": "Barbell Incline Bench Press - Medium Grip",
    "Dumbbell Press": "Dumbbell Bench Press",
    "Dumbbell Bench Press": "Dumbbell Bench Press",
    "Shoulder Press": "Seated Barbell Military Press",
    "Overhead Press": "Seated Barbell Military Press",
    "Military Press": "Seated Barbell Military Press",
    "Squat": "Barbell Squat",
    "Back Squat": "Barbell Squat",
    "Deadlift": "Barbell Deadlift",
    "Conventional Deadlift": "Barbell Deadlift",
    "Dips": "Dips - Chest Version",
    "Pull up": "Pullups",
    "Pull Up": "Pullups",
    "Pullups": "Pullups",
    "Chin Up": "Chin-Up",
    "Chinup": "Chin-Up"
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

    // 2. Check custom mappings (case-insensitive)
    const lowerName = name.toLowerCase();
    const mapped = Object.keys(CUSTOM_MAPPINGS).find(key => key.toLowerCase() === lowerName);
    if (mapped) {
        return CUSTOM_MAPPINGS[mapped];
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
