import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  deleteSession,
  getActiveSession,
  getSchedule,
  getSettings,
  listSessions,
  saveSession,
  saveSettings,
} from "../database/repositories";
import { localDateString } from "../domain/dates";
import { AppSettings, SchedulePeriod, WorkoutSession } from "../domain/models";

type ContextValue = {
  sessions: WorkoutSession[];
  active?: WorkoutSession;
  settings: AppSettings;
  schedule: SchedulePeriod[];
  isInitialized: boolean;
  initializationError?: Error;
  /** Recarrega tudo do banco (após concluir/descartar/restaurar). Aguarda gravações pendentes. */
  refresh: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  /** Atualiza `active` de forma otimista e persiste em fila serializada (sem recarregar a lista). */
  saveActive: (session: WorkoutSession) => Promise<void>;
  /** Persiste o treino como concluído e recarrega os dados. */
  finishSession: (session: WorkoutSession) => Promise<void>;
  /** Remove um treino e recarrega os dados. */
  discardSession: (id: string) => Promise<void>;
};

const AppContext = createContext<ContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [active, setActive] = useState<WorkoutSession>();
  const [settings, setSettings] = useState<AppSettings>(() => ({
    onboardingComplete: false,
    remindersEnabled: false,
    reminderTime: "18:00",
    trackingStartDate: localDateString(),
    soundEnabled: true,
  }));
  const [schedule, setSchedule] = useState<SchedulePeriod[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error>();
  const queue = useRef<Promise<void>>(Promise.resolve());

  const enqueue = useCallback((task: () => Promise<void>) => {
    const run = queue.current.then(task);
    queue.current = run.catch(() => undefined);
    return run;
  }, []);

  const loadData = useCallback(async () => {
    await queue.current;
    const [nextSessions, nextActive, nextSettings, nextSchedule] =
      await Promise.all([
        listSessions(true),
        getActiveSession(),
        getSettings(),
        getSchedule(),
      ]);

    setSessions(nextSessions);
    setActive(nextActive);
    setSettings(nextSettings);
    setSchedule(nextSchedule);
  }, []);

  const initialize = useCallback(async () => {
    setIsInitialized(false);
    setInitializationError(undefined);
    try {
      await loadData();
    } catch (error) {
      setInitializationError(
        error instanceof Error
          ? error
          : new Error("Não foi possível iniciar os dados locais."),
      );
    } finally {
      setIsInitialized(true);
    }
  }, [loadData]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const updateSettings = useCallback(async (next: AppSettings) => {
    await enqueue(() => saveSettings(next));
    setSettings(next);
  }, [enqueue]);

  const saveActive = useCallback(
    (session: WorkoutSession) => {
      setActive(session);
      return enqueue(() => saveSession(session));
    },
    [enqueue],
  );

  const finishSession = useCallback(
    async (session: WorkoutSession) => {
      await enqueue(() => saveSession(session));
      await loadData();
    },
    [enqueue, loadData],
  );

  const discardSession = useCallback(
    async (id: string) => {
      await enqueue(async () => {
        await deleteSession(id);
      });
      await loadData();
    },
    [enqueue, loadData],
  );

  const value = useMemo<ContextValue>(
    () => ({
      sessions,
      active,
      settings,
      schedule,
      isInitialized,
      initializationError,
      refresh: loadData,
      retryInitialization: initialize,
      updateSettings,
      saveActive,
      finishSession,
      discardSession,
    }),
    [
      sessions,
      active,
      settings,
      schedule,
      isInitialized,
      initializationError,
      loadData,
      initialize,
      updateSettings,
      saveActive,
      finishSession,
      discardSession,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
};
