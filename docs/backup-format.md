# Formato de backup do ICNDY

O ICNDY exporta um objeto JSON em UTF-8 (`icndy-backup-AAAA-MM-DD.json`). A versão atual é `schemaVersion: 2`; arquivos `schemaVersion: 1` continuam sendo aceitos e são convertidos para o formato v2 ao restaurar. Qualquer outra versão é rejeitada.

## Estrutura (v2)

| Campo | Descrição |
| --- | --- |
| `schemaVersion` | `2` (ou `1` na importação). |
| `exportedAt` | Data/hora ISO 8601 em UTC, ex.: `2026-01-02T00:00:00.000Z`. |
| `sessions` | Treinos salvos no aparelho. |
| `settings` | Preferências: `onboardingComplete`, `remindersEnabled`, `reminderTime` (`HH:MM`), `trackingStartDate` (`AAAA-MM-DD`) e `soundsEnabled`. |
| `schedules` | Períodos de calendário de treino: `{ id, effectiveFrom, weekdays }`. |

Cada treino contém: `id`, `createdAt`, `startedAt`, `updatedAt`, `finishedAt?`, `pausedAt?`, `localDate`, `status`, `presetId`, `durationSeconds`, `movements`, `completedRounds`, `additionalReps`, `totalReps`, `comparisonKey`, `completionType?`, `notes?`, `pausedDurationMs`, `elapsedBeforePauseMs` e, novos na v2, `roundSplitsMs`, `rpe?` e `partial?`.

- `roundSplitsMs`: tempo ativo acumulado (ms) ao fim de cada round, em ordem crescente.
- `rpe`: esforço percebido, inteiro de 1 a 10 (opcional).
- `partial`: onde o atleta parou no round incompleto, `{ movementIndex, reps }` (opcional).

## Compatibilidade com v1

Um backup v1 não tem `roundSplitsMs`, `rpe` nem `partial`; ao restaurar, os tempos viram uma lista vazia e os demais campos ficam ausentes. A versão v1 também pode omitir preferências; as que faltarem recebem o valor padrão.

### Preferências

A preferência de som se chama `soundsEnabled`. Backups e bancos antigos que usavam `soundEnabled` continuam funcionando: o valor legado só é usado quando `soundsEnabled` não existe. Cada preferência conhecida é validada pelo tipo (e `reminderTime` pelo formato `HH:MM`, `trackingStartDate` como data real) e, se inválida ou ausente, volta ao padrão. Chaves desconhecidas (por exemplo `hapticsEnabled`, `timerDisplay`, `workoutLayout`, `themeIntensity` e `reduceMotion`, gravadas por versões anteriores) são ignoradas e não impedem a restauração.

## Validação

O arquivo inteiro é validado antes de qualquer escrita no banco; se algo estiver errado, nada é alterado e o app mostra uma mensagem em português indicando o treino ou calendário problemático. A validação é uma função pura (`migrateBackup`, em `src/services/backupFormat.ts`) e verifica:

- datas e horários ISO 8601 em UTC (`createdAt`, `startedAt`, `updatedAt`, `finishedAt`, `pausedAt`, `exportedAt`) e datas `AAAA-MM-DD` que existam no calendário (`localDate`, `effectiveFrom`);
- valores permitidos: `status` (`active`, `paused`, `finishing`, `completed`, `abandoned`), `completionType` (`timer-finished`, `ended-early`), `presetId` (`classic`, `beginner`) e `group` dos movimentos (`pull`, `push`, `squat`);
- faixas numéricas: `durationSeconds` entre 60 e 3600; rounds, repetições e tempos como inteiros não negativos; repetições de cada movimento maiores que zero; ao menos um movimento;
- consistência do placar: `additionalReps` menor que as repetições de um round, `totalReps = completedRounds × repetições por round + additionalReps` e `comparisonKey` igual à calculada pela configuração;
- v2: `roundSplitsMs` não negativo e em ordem crescente, `rpe` inteiro de 1 a 10 e `partial` apontando para um movimento existente com repetições abaixo do total daquele movimento;
- identificadores únicos de treinos e de calendários;
- calendários com `weekdays` inteiros de 0 (domingo) a 6 (sábado), sem repetição.

A restauração substitui treinos, preferências e calendários numa única transação do SQLite, que é desfeita se alguma escrita falhar. O backup não inclui segredos, tokens de notificação nem dados do dispositivo.
