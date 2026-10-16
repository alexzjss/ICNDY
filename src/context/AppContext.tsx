import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppSettings, SchedulePeriod, WorkoutSession } from '../domain/models';
import { getActiveSession, getSchedule, getSettings, listSessions, saveSettings } from '../database/repositories';

type ContextValue = { sessions: WorkoutSession[]; active?: WorkoutSession; settings: AppSettings; schedule: SchedulePeriod[]; refresh: () => Promise<void>; updateSettings: (settings: AppSettings) => Promise<void> };
const AppContext = createContext<ContextValue | undefined>(undefined);
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [active, setActive] = useState<WorkoutSession>();
  const [settings, setSettings] = useState<AppSettings>({ onboardingComplete: false, remindersEnabled: false, reminderTime: '18:00', trackingStartDate: new Date().toISOString().slice(0, 10) });
  const [schedule, setSchedule] = useState<SchedulePeriod[]>([]);
  const refresh = async () => { setSessions(await listSessions(true)); setActive(await getActiveSession()); setSettings(await getSettings()); setSchedule(await getSchedule()); };
  useEffect(() => { refresh().catch(console.error); }, []);
  const updateSettings = async (next: AppSettings) => { await saveSettings(next); setSettings(next); };
  return <AppContext.Provider value={{ sessions, active, settings, schedule, refresh, updateSettings }}>{children}</AppContext.Provider>;
};
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
};
