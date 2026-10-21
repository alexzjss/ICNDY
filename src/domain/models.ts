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

/** Onde o atleta parou no round incompleto. */
export type PartialProgress = { movementIndex: number; reps: number };

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
  /** Tempo ATIVO decorrido (ms) no momento de cada round concluído (crescente). */
  roundSplitsMs: number[];
  /** Esforço percebido 1-10. */
  rpe?: number;
  partial?: PartialProgress;
  /** Meta de rounds opcional (1-200). */
  targetRounds?: number;
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
  soundsEnabled: boolean;
};
