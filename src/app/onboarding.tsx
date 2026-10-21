import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Label, Screen, Title } from '../components/ui';
import { useApp } from '../context/AppContext';
import { saveSchedule } from '../database/repositories';
import { colors } from '../theme';
export default function OnboardingScreen() {
  const { settings, updateSettings, refresh } = useApp(); const [days, setDays] = useState([1, 3, 5]); const [saving, setSaving] = useState(false);
  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveSchedule(days);
      await updateSettings({ ...settings, onboardingComplete: true });
      await refresh();
    } catch (error) {
      Alert.alert("Could not finish setup", error instanceof Error ? error.message : "Your settings were not saved.");
    } finally {
      setSaving(false);
    }
  };
  return <Screen><View style={styles.hero}><Text style={styles.wordmark}>ICNDY</Text><Label>YOUR BENCHMARK, YOUR LOG</Label><Title>Train with intent.</Title><Text style={styles.copy}>A focused offline companion for Cindy. Track the work, build the habit, keep the record.</Text></View><Card><Label>Planned training days</Label><Text style={styles.copy}>Pick the days you aim to train. Rest days never break your streak.</Text><View style={styles.days}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Pressable key={`${day}-${index}`} onPress={() => setDays(days.includes(index) ? days.filter((item) => item !== index) : [...days, index].sort())} style={[styles.day, days.includes(index) && styles.active]}><Text style={[styles.dayText, days.includes(index) && styles.activeText]}>{day}</Text></Pressable>)}</View></Card><Button onPress={finish}>{saving ? 'Saving…' : 'Enter ICNDY'}</Button><Text style={styles.notice}>You can change this schedule any time. Reminders are optional and can be enabled later.</Text></Screen>;
}
const styles = StyleSheet.create({ hero: { gap: 12, paddingTop: 40, paddingBottom: 20 }, wordmark: { color: colors.lime, fontSize: 54, fontWeight: '900', letterSpacing: -4 }, copy: { color: colors.muted, lineHeight: 22, fontSize: 15 }, days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, day: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, active: { backgroundColor: colors.lime }, dayText: { color: colors.muted, fontWeight: '900' }, activeText: { color: colors.ink }, notice: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 } });
