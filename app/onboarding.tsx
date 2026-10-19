import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Label, Screen, Title } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';
import { saveSchedule } from '../src/database/repositories';
import { colors } from '../src/theme';
export default function OnboardingScreen() {
  const router = useRouter(); const { settings, updateSettings, refresh } = useApp(); const [days, setDays] = useState([1, 3, 5]); const [saving, setSaving] = useState(false);
  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveSchedule(days);
      await updateSettings({ ...settings, onboardingComplete: true });
      await refresh();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Não foi possível concluir", error instanceof Error ? error.message : "Suas preferências não foram salvas.");
    } finally {
      setSaving(false);
    }
  };
  return <Screen><View style={styles.hero}><Text style={styles.wordmark}>ICNDY</Text><Label>SEU TREINO. SEU REGISTRO.</Label><Title>Treine com intenção.</Title><Text style={styles.copy}>Um companheiro offline para Cindy. Registre cada volta, crie consistência e acompanhe sua evolução.</Text></View><Card><Label>Seus dias de treino</Label><Text style={styles.copy}>Escolha os dias planejados. Dias de descanso não interrompem sua sequência.</Text><View style={styles.days}>{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <Pressable key={`${day}-${index}`} accessibilityRole="checkbox" accessibilityLabel={['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][index]} accessibilityState={{ checked: days.includes(index) }} onPress={() => setDays(days.includes(index) ? days.filter((item) => item !== index) : [...days, index].sort())} style={[styles.day, days.includes(index) && styles.active]}><Text style={[styles.dayText, days.includes(index) && styles.activeText]}>{day}</Text></Pressable>)}</View></Card><Button onPress={finish}>{saving ? 'Salvando…' : 'Começar'}</Button><Text style={styles.notice}>Você pode alterar a programação depois. Os lembretes são opcionais.</Text></Screen>;
}
const styles = StyleSheet.create({ hero: { gap: 12, paddingTop: 40, paddingBottom: 20 }, wordmark: { color: colors.lime, fontSize: 54, fontWeight: '900', letterSpacing: -4 }, copy: { color: colors.muted, lineHeight: 22, fontSize: 15 }, days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, day: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, active: { backgroundColor: colors.lime }, dayText: { color: colors.muted, fontWeight: '900' }, activeText: { color: colors.ink }, notice: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 } });
