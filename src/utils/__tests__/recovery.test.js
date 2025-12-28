import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateRecovery } from '../recovery';

// Mock the exercisesData import
vi.mock('../data/exercises.json', () => ({
    default: [
        {
            id: 'bench_press_1',
            name: 'Barbell Bench Press - Medium Grip',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['triceps', 'shoulders']
        },
        {
            id: 'squat_1',
            name: 'Barbell Squat',
            primaryMuscles: ['quadriceps', 'glutes'],
            secondaryMuscles: ['hamstrings', 'calves']
        },
        {
            id: 'deadlift_1',
            name: 'Barbell Deadlift',
            primaryMuscles: ['lower back', 'hamstrings'],
            secondaryMuscles: ['glutes', 'traps', 'forearms']
        },
        {
            id: 'pullup_1',
            name: 'Pullups',
            primaryMuscles: ['lats'],
            secondaryMuscles: ['biceps', 'middle back']
        },
        {
            id: 'curl_1',
            name: 'Barbell Curl',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms']
        }
    ]
}));

// Mock normalizeExercise to return the name as-is for testing
vi.mock('../exerciseNormalization', () => ({
    normalizeExercise: vi.fn((name) => name)
}));

describe('Recovery Utils', () => {
    let mockDate;
    const MS_PER_DAY = 86400000;

    beforeEach(() => {
        // Mock current date to 2025-01-15 12:00:00
        mockDate = new Date('2025-01-15T12:00:00Z');
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('Edge Cases - Empty/Invalid History', () => {
        it('returns empty object for null history', () => {
            const result = calculateRecovery(null);
            expect(result).toEqual({});
        });

        it('returns empty object for undefined history', () => {
            const result = calculateRecovery(undefined);
            expect(result).toEqual({});
        });

        it('returns empty object for empty array', () => {
            const result = calculateRecovery([]);
            expect(result).toEqual({});
        });
    });

    describe('Basic Recovery Calculation', () => {
        it('returns all muscles at 100% recovery with no recent workouts', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 10 * MS_PER_DAY).toISOString(), // 10 days ago
                exercises: [
                    {
                        name: 'Barbell Bench Press - Medium Grip',
                        originalId: 'bench_press_1',
                        sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
                    }
                ]
            }];
            const result = calculateRecovery(history);
            // All muscles should be 100 (fully recovered) since workout is > 7 days ago
            Object.values(result).forEach(value => {
                expect(value).toBe(100);
            });
        });

        it('shows reduced recovery for recent chest workout', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(), // 1 day ago
                exercises: [
                    {
                        name: 'Barbell Bench Press - Medium Grip',
                        originalId: 'bench_press_1',
                        sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] // 3 sets
                    }
                ]
            }];
            const result = calculateRecovery(history);

            // Chest should have reduced recovery
            expect(result.chest).toBeLessThan(100);
            // Lats (not worked) should be 100
            expect(result.lats).toBe(100);
        });

        it('calculates strain based on number of sets', () => {
            // More sets = more fatigue
            const historyFewSets = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [{
                    name: 'Barbell Bench Press - Medium Grip',
                    originalId: 'bench_press_1',
                    sets: [{ reps: 10 }] // 1 set
                }]
            }];

            const historyManySets = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [{
                    name: 'Barbell Bench Press - Medium Grip',
                    originalId: 'bench_press_1',
                    sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }, { reps: 10 }] // 4 sets
                }]
            }];

            const resultFew = calculateRecovery(historyFewSets);
            const resultMany = calculateRecovery(historyManySets);

            // More sets = lower recovery (more fatigue)
            expect(resultMany.chest).toBeLessThan(resultFew.chest);
        });
    });

    describe('Decay Over Time', () => {
        it('shows higher recovery for older workouts', () => {
            const historyRecent = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(), // 1 day ago
                exercises: [{
                    name: 'Barbell Bench Press - Medium Grip',
                    originalId: 'bench_press_1',
                    sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
                }]
            }];

            const historyOlder = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 5 * MS_PER_DAY).toISOString(), // 5 days ago
                exercises: [{
                    name: 'Barbell Bench Press - Medium Grip',
                    originalId: 'bench_press_1',
                    sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
                }]
            }];

            const resultRecent = calculateRecovery(historyRecent);
            const resultOlder = calculateRecovery(historyOlder);

            // Older workout = more recovered
            expect(resultOlder.chest).toBeGreaterThan(resultRecent.chest);
        });

        it('excludes workouts older than 7 days', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 8 * MS_PER_DAY).toISOString(), // 8 days ago
                exercises: [{
                    name: 'Barbell Bench Press - Medium Grip',
                    originalId: 'bench_press_1',
                    sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
                }]
            }];
            const result = calculateRecovery(history);

            // Should be fully recovered
            expect(result.chest).toBe(100);
        });
    });

    describe('Secondary Muscles', () => {
        it('applies 50% strain to secondary muscles', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [{
                    name: 'Barbell Bench Press - Medium Grip',
                    originalId: 'bench_press_1',
                    sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
                }]
            }];
            const result = calculateRecovery(history);

            // Triceps is secondary for bench press, should have less fatigue than chest
            expect(result.triceps).toBeGreaterThan(result.chest);
            // But triceps should still be somewhat fatigued
            expect(result.triceps).toBeLessThan(100);
        });
    });

    describe('Muscle Mapping', () => {
        it('maps quadriceps to quads', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [{
                    name: 'Barbell Squat',
                    originalId: 'squat_1',
                    sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
                }]
            }];
            const result = calculateRecovery(history);

            expect(result.quads).toBeLessThan(100);
            expect(result).not.toHaveProperty('quadriceps');
        });
    });

    describe('Keyword Inference Fallback', () => {
        it('infers muscles from exercise name keywords', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [{
                    name: 'Custom Chest Exercise', // Should infer chest from "chest" keyword
                    sets: [{ reps: 10 }, { reps: 10 }]
                }]
            }];
            const result = calculateRecovery(history);

            // Chest should be fatigued from keyword inference
            expect(result.chest).toBeLessThan(100);
        });

        it('infers biceps from curl keyword', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [{
                    name: 'Hammer Curl', // Should infer biceps from "curl" keyword
                    sets: [{ reps: 10 }, { reps: 10 }]
                }]
            }];
            const result = calculateRecovery(history);

            expect(result.biceps).toBeLessThan(100);
        });
    });

    describe('Multiple Exercises', () => {
        it('accumulates fatigue from multiple exercises', () => {
            const historySingle = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [{
                    name: 'Barbell Bench Press - Medium Grip',
                    originalId: 'bench_press_1',
                    sets: [{ reps: 10 }, { reps: 10 }]
                }]
            }];

            const historyMultiple = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: [
                    {
                        name: 'Barbell Bench Press - Medium Grip',
                        originalId: 'bench_press_1',
                        sets: [{ reps: 10 }, { reps: 10 }]
                    },
                    {
                        name: 'Custom Chest Exercise',
                        sets: [{ reps: 10 }, { reps: 10 }]
                    }
                ]
            }];

            const resultSingle = calculateRecovery(historySingle);
            const resultMultiple = calculateRecovery(historyMultiple);

            // Multiple exercises = more chest fatigue
            expect(resultMultiple.chest).toBeLessThan(resultSingle.chest);
        });
    });

    describe('Sessions Without Exercises', () => {
        it('handles sessions with no exercises gracefully', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString(),
                exercises: null
            }];

            expect(() => calculateRecovery(history)).not.toThrow();
            const result = calculateRecovery(history);
            Object.values(result).forEach(value => {
                expect(value).toBe(100);
            });
        });

        it('handles sessions with undefined exercises', () => {
            const history = [{
                id: '1',
                endTime: new Date(mockDate.getTime() - 1 * MS_PER_DAY).toISOString()
                // exercises is undefined
            }];

            expect(() => calculateRecovery(history)).not.toThrow();
        });
    });
});
