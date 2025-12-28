/**
 * Core type definitions for DuoGym application
 */

// ============ Exercise Types ============

export interface Exercise {
    id: string;
    name: string;
    originalId?: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    sets: ExerciseSet[];
    completed?: boolean;
}

export interface ExerciseSet {
    id?: string;
    reps: number;
    weight: number;
    completed?: boolean;
}

export interface ExerciseDefinition {
    id: string;
    name: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment?: string;
    category?: string;
}

// ============ Workout Types ============

export interface Workout {
    id: string;
    name: string;
    exercises: Exercise[];
    lastPerformed?: string;
    usageCount?: number;
}

export interface WorkoutSession {
    id: string;
    workoutId: string;
    profileId: string;
    name: string;
    exercises: Exercise[];
    startTime: string;
    endTime: string;
    duration: number;
    date: string;
}

// ============ Profile Types ============

export interface Profile {
    id: string;
    name: string;
    theme: 'blue' | 'indigo' | string;
}

export interface ProfileDetails {
    age?: string | number;
    weight?: string | number;
    height?: string | number;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    goal?: 'general-fitness' | 'muscle-gain' | 'weight-loss' | 'strength' | 'endurance';
    weeklyGoal?: number;
}

export interface WeightEntry {
    id: string;
    profileId: string;
    date: string;
    weight: number;
}

// ============ Gamification Types ============

export interface Level {
    name: string;
    minWorkouts: number;
    color: string;
    icon: string;
}

export interface GamificationStats {
    level: Level;
    nextLevel: Level;
    progress: number;
    streak: number;
    momentum: number;
    totalWorkouts: number;
}

// ============ Auth Types ============

export interface User {
    id: string;
    username: string;
}

export interface AuthData {
    token: string;
    user: User;
}

// ============ Recovery Types ============

export type MuscleGroup =
    | 'abs'
    | 'hamstrings'
    | 'calves'
    | 'chest'
    | 'triceps'
    | 'biceps'
    | 'shoulders'
    | 'lats'
    | 'upper_back'
    | 'lower_back'
    | 'traps'
    | 'quads'
    | 'glutes'
    | 'forearms'
    | 'legs_inner'
    | 'legs_outer'
    | 'neck';

export type RecoveryMap = Partial<Record<MuscleGroup, number>>;

// ============ Store Types ============

export interface StoreData {
    profiles: Profile[];
    workouts: Record<string, Workout[]>;
    history: WorkoutSession[];
    weightHistory: WeightEntry[];
    profileDetails: Record<string, ProfileDetails>;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
