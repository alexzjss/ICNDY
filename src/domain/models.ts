export type WorkoutStatus = 'active' | 'paused' | 'finishing' | 'completed' | 'abandoned';
export type CompletionType = 'timer-finished' | 'ended-early';
export type MovementKey = 'pull' | 'push' | 'squat';

export type MovementOption = {
  key: string;
  label: string;
  reps: number;
  group: MovementKey;
};

export type WorkoutPreset = {
  id: 'classic' | 'beginner';
  name: string;
  description: string;
  durationMinutes: number;
  movements: MovementOption[];
};

export type WorkoutConfig = {
  presetId: WorkoutPreset['id'];
  durationSeconds: number;
  movements: MovementOption[];
};

export type WorkoutSession = WorkoutConfig & {
  id: string;
  createdAt: string;
  startedAt: string;
  finishedAt?: string;
  updatedAt: string;
  status: WorkoutStatus;
  completedRounds: number;
  additionalReps: number;
  totalReps: number;
  comparisonKey: string;
  completionType?: CompletionType;
  notes?: string;
  localDate: string;
  pausedAt?: string;
  pausedDurationMs: number;
  elapsedBeforePauseMs: number;
};

export type SchedulePeriod = {
  id: string;
  effectiveFrom: string;
  weekdays: number[];
};

export type AppSettings = {
  onboardingComplete: boolean;
  remindersEnabled: boolean;
  reminderTime: string;
  trackingStartDate: string;
  timerDisplay: 'numeric' | 'circular';
  workoutLayout: 'compact' | 'detailed';
  themeIntensity: 'discreet' | 'vibrant' | 'contrast';
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
  reduceMotion: boolean;
};
