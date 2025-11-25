export const FRENCH_TO_ENGLISH_MAP = {
    // Muscles
    'abdominaux': 'abdominals',
    'abs': 'abdominals',
    'abdos': 'abdominals',
    'adducteurs': 'adductors',
    'biceps': 'biceps',
    'mollets': 'calves',
    'pectoraux': 'chest',
    'pecs': 'chest',
    'avant-bras': 'forearms',
    'fessiers': 'glutes',
    'ischios': 'hamstrings',
    'ischio-jambiers': 'hamstrings',
    'dorsaux': 'lats',
    'grand dorsal': 'lats',
    'lombaires': 'lower back',
    'dos moyen': 'middle back',
    'cou': 'neck',
    'quadriceps': 'quadriceps',
    'quads': 'quadriceps',
    'épaules': 'shoulders',
    'trapèzes': 'traps',
    'triceps': 'triceps',

    // Equipment
    'barre': 'barbell',
    'corps': 'body only',
    'poids du corps': 'body only',
    'câble': 'cable',
    'poulie': 'cable',
    'haltère': 'dumbbell',
    'haltères': 'dumbbell',
    'barre ez': 'e-z curl bar',
    'bande élastique': 'bands',
    'élastique': 'bands',
    'kettlebell': 'kettlebells',
    'machine': 'machine',
    'ballon': 'medicine ball',
    'médecine ball': 'medicine ball',

    // Categories
    'cardio': 'cardio',
    'force': 'strength',
    'étirement': 'stretching',
    'stretching': 'stretching',
    'plyométrie': 'plyometrics',
    'powerlifting': 'powerlifting',
    'strongman': 'strongman',
    'olympique': 'olympic weightlifting',
    'haltérophilie': 'olympic weightlifting'
};

export const translateSearchTerm = (term) => {
    const lowerTerm = term.toLowerCase().trim();
    return FRENCH_TO_ENGLISH_MAP[lowerTerm] || lowerTerm;
};
