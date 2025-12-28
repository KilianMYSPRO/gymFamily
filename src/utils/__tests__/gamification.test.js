import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateGamificationStats, LEVELS } from '../gamification';

describe('Gamification Utils', () => {
    let mockDate;

    beforeEach(() => {
        // Mock current date to 2025-01-15 12:00:00
        mockDate = new Date('2025-01-15T12:00:00Z');
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('LEVELS', () => {
        it('should have 6 levels defined', () => {
            expect(LEVELS).toHaveLength(6);
        });

        it('should have increasing minWorkouts', () => {
            for (let i = 1; i < LEVELS.length; i++) {
                expect(LEVELS[i].minWorkouts).toBeGreaterThan(LEVELS[i - 1].minWorkouts);
            }
        });
    });

    describe('calculateGamificationStats', () => {
        describe('Edge Cases - Empty/Invalid History', () => {
            it('returns defaults for null history', () => {
                const result = calculateGamificationStats(null);
                expect(result).toEqual({
                    level: LEVELS[0],
                    nextLevel: LEVELS[1],
                    progress: 0,
                    streak: 0,
                    momentum: 0,
                    totalWorkouts: 0
                });
            });

            it('returns defaults for undefined history', () => {
                const result = calculateGamificationStats(undefined);
                expect(result.totalWorkouts).toBe(0);
                expect(result.level.name).toBe('Rookie');
            });

            it('returns defaults for empty array', () => {
                const result = calculateGamificationStats([]);
                expect(result.totalWorkouts).toBe(0);
            });

            it('filters out entries with missing endTime', () => {
                const history = [
                    { id: '1', endTime: '2025-01-14T10:00:00Z' },
                    { id: '2', endTime: null },
                    { id: '3' }, // missing endTime
                    { id: '4', endTime: '2025-01-13T10:00:00Z' }
                ];
                const result = calculateGamificationStats(history);
                expect(result.totalWorkouts).toBe(2);
            });

            it('filters out entries with invalid date strings', () => {
                const history = [
                    { id: '1', endTime: '2025-01-14T10:00:00Z' },
                    { id: '2', endTime: 'not-a-date' },
                    { id: '3', endTime: 'invalid' }
                ];
                const result = calculateGamificationStats(history);
                expect(result.totalWorkouts).toBe(1);
            });

            it('handles non-array input gracefully', () => {
                const result = calculateGamificationStats('not an array');
                expect(result.totalWorkouts).toBe(0);
            });
        });

        describe('Level Calculation', () => {
            it('returns Rookie for 0-9 workouts', () => {
                const history = Array(5).fill(null).map((_, i) => ({
                    id: String(i),
                    endTime: new Date(mockDate.getTime() - i * 86400000).toISOString()
                }));
                const result = calculateGamificationStats(history);
                expect(result.level.name).toBe('Rookie');
            });

            it('returns Regular for 10+ workouts', () => {
                const history = Array(10).fill(null).map((_, i) => ({
                    id: String(i),
                    endTime: new Date(mockDate.getTime() - i * 86400000).toISOString()
                }));
                const result = calculateGamificationStats(history);
                expect(result.level.name).toBe('Regular');
            });

            it('returns Gym Rat for 50+ workouts', () => {
                const history = Array(50).fill(null).map((_, i) => ({
                    id: String(i),
                    endTime: new Date(mockDate.getTime() - i * 86400000).toISOString()
                }));
                const result = calculateGamificationStats(history);
                expect(result.level.name).toBe('Gym Rat');
            });

            it('returns Legend for 500+ workouts', () => {
                const history = Array(500).fill(null).map((_, i) => ({
                    id: String(i),
                    endTime: new Date(mockDate.getTime() - i * 86400000).toISOString()
                }));
                const result = calculateGamificationStats(history);
                expect(result.level.name).toBe('Legend');
            });

            it('calculates progress towards next level correctly', () => {
                // 5 workouts: Rookie (0) -> Regular (10), progress = 50%
                const history = Array(5).fill(null).map((_, i) => ({
                    id: String(i),
                    endTime: new Date(mockDate.getTime() - i * 86400000).toISOString()
                }));
                const result = calculateGamificationStats(history);
                expect(result.progress).toBe(50);
            });

            it('caps progress at 100%', () => {
                // At max level, progress shouldn't exceed 100
                const history = Array(600).fill(null).map((_, i) => ({
                    id: String(i),
                    endTime: new Date(mockDate.getTime() - i * 86400000).toISOString()
                }));
                const result = calculateGamificationStats(history);
                expect(result.progress).toBeLessThanOrEqual(100);
            });
        });

        describe('Streak Calculation', () => {
            it('returns streak of 0 if no workouts in last 4 days', () => {
                const history = [{
                    id: '1',
                    endTime: new Date(mockDate.getTime() - 5 * 86400000).toISOString() // 5 days ago
                }];
                const result = calculateGamificationStats(history);
                expect(result.streak).toBe(0);
            });

            it('returns streak of 1 for single recent workout', () => {
                const history = [{
                    id: '1',
                    endTime: new Date(mockDate.getTime() - 1 * 86400000).toISOString() // 1 day ago
                }];
                const result = calculateGamificationStats(history);
                expect(result.streak).toBe(1);
            });

            it('counts consecutive workouts within 4-day gaps', () => {
                // Workouts on consecutive days
                const history = [
                    { id: '1', endTime: new Date(mockDate.getTime() - 1 * 86400000).toISOString() },
                    { id: '2', endTime: new Date(mockDate.getTime() - 2 * 86400000).toISOString() },
                    { id: '3', endTime: new Date(mockDate.getTime() - 3 * 86400000).toISOString() }
                ];
                const result = calculateGamificationStats(history);
                expect(result.streak).toBe(3);
            });

            it('breaks streak when gap exceeds 4 days', () => {
                const history = [
                    { id: '1', endTime: new Date(mockDate.getTime() - 1 * 86400000).toISOString() },
                    { id: '2', endTime: new Date(mockDate.getTime() - 2 * 86400000).toISOString() },
                    { id: '3', endTime: new Date(mockDate.getTime() - 7 * 86400000).toISOString() } // 5 day gap
                ];
                const result = calculateGamificationStats(history);
                expect(result.streak).toBe(2);
            });

            it('allows up to 3 rest days between workouts', () => {
                const history = [
                    { id: '1', endTime: new Date(mockDate.getTime() - 1 * 86400000).toISOString() },
                    { id: '2', endTime: new Date(mockDate.getTime() - 4 * 86400000).toISOString() } // 3 day gap
                ];
                const result = calculateGamificationStats(history);
                expect(result.streak).toBe(2);
            });
        });

        describe('Momentum Calculation', () => {
            it('returns 0 momentum for no recent workouts', () => {
                const history = [{
                    id: '1',
                    endTime: new Date(mockDate.getTime() - 30 * 86400000).toISOString() // 30 days ago
                }];
                const result = calculateGamificationStats(history);
                expect(result.momentum).toBe(0);
            });

            it('calculates momentum based on workouts in last 14 days', () => {
                // 3 workouts in last 14 days = 50% momentum (target is 6)
                const history = [
                    { id: '1', endTime: new Date(mockDate.getTime() - 1 * 86400000).toISOString() },
                    { id: '2', endTime: new Date(mockDate.getTime() - 5 * 86400000).toISOString() },
                    { id: '3', endTime: new Date(mockDate.getTime() - 10 * 86400000).toISOString() }
                ];
                const result = calculateGamificationStats(history);
                expect(result.momentum).toBe(50);
            });

            it('caps momentum at 100%', () => {
                // More than 6 workouts in 14 days
                const history = Array(10).fill(null).map((_, i) => ({
                    id: String(i),
                    endTime: new Date(mockDate.getTime() - i * 86400000).toISOString()
                }));
                const result = calculateGamificationStats(history);
                expect(result.momentum).toBe(100);
            });

            it('excludes workouts older than 14 days from momentum', () => {
                const history = [
                    { id: '1', endTime: new Date(mockDate.getTime() - 1 * 86400000).toISOString() },
                    { id: '2', endTime: new Date(mockDate.getTime() - 20 * 86400000).toISOString() }, // excluded
                    { id: '3', endTime: new Date(mockDate.getTime() - 30 * 86400000).toISOString() }  // excluded
                ];
                const result = calculateGamificationStats(history);
                // Only 1 workout in last 14 days = 16.67%
                expect(result.momentum).toBeCloseTo(16.67, 1);
            });
        });
    });
});
