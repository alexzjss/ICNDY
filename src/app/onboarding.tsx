import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, MovementPill, Screen, StaggerIn, Text, Toggle, useToast } from '../components';
import { useApp } from '../context/AppContext';
import { saveSchedule } from '../database/repositories';
import { localDateString } from '../domain/dates';
import { getPreset } from '../domain/presets';
import { StepIndicator } from '../features/onboarding/StepIndicator';
import { Wordmark } from '../features/onboarding/Wordmark';
import { DayPicker } from '../features/settings/DayPicker';
import { TimePicker } from '../features/settings/TimePicker';
import { updateTrainingReminders } from '../services/notifications';
import { colors } from '../theme';

const STEPS = 3;

export default function OnboardingScreen() {
  const { settings, updateSettings, refresh } = useApp();
  const toast = useToast();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [days, setDays] = useState([1, 3, 5]);
  const [reminders, setReminders] = useState(false);
  const [time, setTime] = useState('18:00');
  const [saving, setSaving] = useState(false);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // A agenda escolhida vale a partir de hoje.
      await saveSchedule(days, localDateString());
      let remindersEnabled = false;
      if (reminders) {
        // Só pede permissão se o usuário ativou o lembrete.
        remindersEnabled = await updateTrainingReminders(true, days, time).catch(() => false);
        if (!remindersEnabled) toast.show({ message: 'Sem permissão de notificações. Você pode ativar depois em Ajustes.', variant: 'danger', duration: 5000 });
      }
      await refresh();
      // Por último: o guard do root layout leva às abas quando onboardingComplete vira true.
      await updateSettings({ ...settings, onboardingComplete: true, remindersEnabled, reminderTime: time });
    } catch (error) {
      toast.show({ message: error instanceof Error ? error.message : 'Suas configurações não foram salvas.', variant: 'danger' });
      setSaving(false);
    }
  };

  const entering = reduced ? FadeIn : direction === 1 ? SlideInRight.springify().damping(20) : SlideInLeft.springify().damping(20);
  const exiting = reduced ? FadeOut : direction === 1 ? SlideOutLeft.duration(220) : SlideOutRight.duration(220);
  const classic = getPreset('classic');

  return (
    <Screen scroll={false} contentContainerStyle={styles.page}>
      <StepIndicator step={step} total={STEPS} />
      <View style={styles.stage}>
        <Animated.View key={step} entering={entering} exiting={exiting} style={styles.step}>
          {step === 0 ? (
            <>
              <View style={styles.hero}>
                <Wordmark />
              </View>
              <StaggerIn index={6} style={styles.copy}>
                <Text variant="title" align="center">Treine com intenção.</Text>
                <Text variant="body" color={colors.muted} align="center">
                  Um companheiro offline para o Cindy: {classic.durationMinutes} minutos, o máximo de rounds que você aguentar.
                </Text>
                <View style={styles.pills}>
                  {classic.movements.map((m) => (
                    <MovementPill key={m.key} movement={m} />
                  ))}
                </View>
              </StaggerIn>
            </>
          ) : null}
          {step === 1 ? (
            <View style={styles.copy}>
              <Text variant="label" color={colors.accent}>Passo 2</Text>
              <Text variant="title">Quando você treina?</Text>
              <Text variant="body" color={colors.muted}>Escolha os dias planejados. Dias de descanso nunca quebram sua sequência.</Text>
              <Card style={styles.card}>
                <DayPicker value={days} onChange={setDays} />
                <Text variant="caption" align="center">
                  {days.length === 0 ? 'Escolha ao menos um dia' : `${days.length} ${days.length === 1 ? 'dia' : 'dias'} por semana`}
                </Text>
              </Card>
            </View>
          ) : null}
          {step === 2 ? (
            <View style={styles.copy}>
              <Text variant="label" color={colors.accent}>Passo 3</Text>
              <Text variant="title">Quer um lembrete?</Text>
              <Text variant="body" color={colors.muted}>Uma notificação nos dias planejados. É opcional, e só pedimos permissão se você ativar.</Text>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Ionicons name="notifications-outline" size={22} color={colors.accent} />
                  <Text variant="heading" style={styles.flex}>Lembrar nos dias de treino</Text>
                  <Toggle accessibilityLabel="Lembretes de treino" value={reminders} onValueChange={setReminders} />
                </View>
                {reminders ? (
                  <Animated.View entering={reduced ? undefined : FadeIn.duration(250)} exiting={reduced ? undefined : FadeOut.duration(150)}>
                    <TimePicker value={time} onChange={setTime} />
                  </Animated.View>
                ) : null}
              </Card>
            </View>
          ) : null}
        </Animated.View>
      </View>
      <View style={styles.footer}>
        {step < STEPS - 1 ? (
          <Button iconRight="arrow-forward" disabled={step === 1 && days.length === 0} onPress={() => go(step + 1)}>
            {step === 0 ? 'Começar' : 'Continuar'}
          </Button>
        ) : (
          <Button loading={saving} icon="checkmark" onPress={() => void finish()}>Entrar no ICNDY</Button>
        )}
        {step > 0 ? (
          <Button variant="ghost" size="sm" disabled={saving} onPress={() => go(step - 1)}>Voltar</Button>
        ) : (
          <Text variant="caption" align="center">Seus dados ficam apenas neste aparelho.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 20 },
  stage: { flex: 1, overflow: 'hidden' },
  step: { flex: 1, justifyContent: 'center', gap: 20 },
  hero: { alignItems: 'center', paddingTop: 16 },
  copy: { gap: 12 },
  pills: { gap: 8, alignItems: 'center', marginTop: 8 },
  card: { gap: 16, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  footer: { gap: 8 },
});
