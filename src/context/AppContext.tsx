import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getActiveSession,
  getSchedule,
  getSettings,
  listSessions,
  saveSettings,
  defaultSettings,
} from "../database/repositories";
import { AppSettings, SchedulePeriod, WorkoutSession } from "../domain/models";
import { unloadFeedbackSound } from "../services/feedback";
import { getThemeColors, ThemeColors } from "../theme";

type ContextValue = {
  sessions: WorkoutSession[];
  active?: WorkoutSession;
  settings: AppSettings;
  schedule: SchedulePeriod[];
  isInitialized: boolean;
  initializationError?: Error;
  refresh: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  theme: ThemeColors;
};
const AppContext = createContext<ContextValue | undefined>(undefined);
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [active, setActive] = useState<WorkoutSession>();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [schedule, setSchedule] = useState<SchedulePeriod[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error>();

  const loadData = useCallback(async () => {
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
      const normalizedError =
        error instanceof Error
          ? error
          : new Error("Unable to initialize local training data.");
      setInitializationError(normalizedError);
    } finally {
      setIsInitialized(true);
    }
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    void initialize();
    return () => {
      void unloadFeedbackSound();
    };
  }, [initialize]);

  const updateSettings = async (next: AppSettings) => {
    const normalized = await saveSettings(next);
    setSettings(normalized);
  };

  return (
    <AppContext.Provider
      value={{
        sessions,
        active,
        settings,
        schedule,
        isInitialized,
        initializationError,
        refresh,
        retryInitialization: initialize,
        updateSettings,
        theme: getThemeColors(settings.themeIntensity),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
};
