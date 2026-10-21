import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Screen, StaggerIn, Text } from '../components';
import { useApp } from '../context/AppContext';
import { saveSchedule } from '../database/repositories';
import { localDateString } from '../domain/dates';
import { colors, fonts } from '../theme';

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function OnboardingScreen() {
  const { settings, updateSettings, refresh } = useApp();
  const [days, setDays] = useState([1, 3, 5]);
  const [saving, setSaving] = useState(false);
  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // A agenda escolhida vale a partir de hoje (substitui o período inicial).
      await saveSchedule(days, localDateString());
      await updateSettings({ ...settings, onboardingComplete: true });
      await refresh();
    } catch (error) {
      Alert.alert('Não foi possível concluir', error instanceof Error ? error.message : 'Suas configurações não foram salvas.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen>
      <StaggerIn index={0} style={styles.hero}>
        <Text variant="display" color={colors.accent}>ICNDY</Text>
        <Text variant="label">Seu benchmark, seu registro</Text>
        <Text variant="title">Treine com intenção.</Text>
        <Text variant="body" color={colors.muted}>Um companheiro offline para o Cindy. Registre o trabalho, construa o hábito, guarde o recorde.</Text>
      </StaggerIn>
      <StaggerIn index={1}>
        <Card>
          <Text variant="label">Dias de treino planejados</Text>
          <Text variant="body" color={colors.muted}>Escolha os dias em que pretende treinar. Dias de descanso nunca quebram sua sequência.</Text>
          <View style={styles.days}>
            {DAYS.map((day, index) => {
              const on = days.includes(index);
              return (
                <Pressable key={index} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setDays(on ? days.filter((d) => d !== index) : [...days, index].sort())} style={[styles.day, on && styles.dayOn]}>
                  <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: on ? colors.onAccent : colors.muted }}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </StaggerIn>
      <StaggerIn index={2}>
        <Button loading={saving} onPress={finish}>Entrar no ICNDY</Button>
      </StaggerIn>
      <Text variant="caption" align="center">Você pode mudar a agenda quando quiser. Os lembretes são opcionais e podem ser ativados depois.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 8, paddingTop: 40, paddingBottom: 12 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  day: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.accent },
});
