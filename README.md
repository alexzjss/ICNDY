# ICNDY

ICNDY é um app Android offline-first para treinar o benchmark **Cindy**. Ele cobre sessões Cindy configuráveis (Clássico e Iniciante), cronômetro baseado em timestamps, registro de rounds, histórico local de treinos, métricas de progresso, sequências de dias planejados, lembretes opcionais e backup/restauração em JSON local.

## Recursos

- **Treino Cindy em tela cheia:** toque em qualquer lugar da tela para registrar um round. Segure para desfazer o último toque.
- **Relógio regressivo gigante:** o líquido na tela muda para a cor do round atual, com o número do round e a sequência de movimentos.
- **Contagem regressiva 3-2-1:** começa o treino com bipes de contagem, bipes no último minuto e bipe final. Os sons podem ser desligados em Ajustes.
- **Ritmo vs. PR:** um indicador mostra se você está no ritmo do seu melhor resultado naquela configuração.
- **Pausar e retomar:** o cronômetro é recalculado a partir de timestamps, então o tempo continua correto mesmo se o app for fechado durante o treino.
- **Desfazer:** corrija um toque errado sem sair do treino.
- **Resumo do treino:** registre o round parcial em que parou, o esforço percebido (RPE) e os tempos por round (splits). O app também indica novos PRs.
- **Histórico editável:** altere rounds, round parcial, RPE e notas de treinos já salvos, ou exclua um treino (com confirmação).
- **Progresso:** gráfico de evolução, calendário de consistência de 16 semanas, histórico agrupado por mês e sequências de dias planejados.
- **Conquistas:** marcos de consistência e de desempenho, exibidos na aba Progresso.
- **Lembretes:** notificações nos dias de treino escolhidos, com horário configurável. Só são ativados se você permitir.
- **Backup local:** exporte todos os dados em JSON e restaure depois. A restauração substitui os dados locais, então confirme antes.
- **Privacidade:** os dados ficam no aparelho. O código não faz chamadas de rede, não exige conta e não sincroniza na nuvem.

## Download do APK Android

**[Baixar o APK mais recente do ICNDY](https://github.com/alexzjss/ICNDY/releases/latest/download/ICNDY.apk)** · [Ver todas as versões](https://github.com/alexzjss/ICNDY/releases)

O link direto só fica disponível depois que a primeira GitHub Release publicar o `ICNDY.apk`. Se o GitHub informar que o arquivo ou a última release não existe, ainda não há APK público. Não baixe cópias não oficiais de outros repositórios.

### Instalar no Android

1. Abra a [última release](https://github.com/alexzjss/ICNDY/releases/latest) e baixe o **`ICNDY.apk`** em **Assets**. Você também pode usar o link direto acima quando a release existir.
2. Abra o APK baixado no seu celular Android.
3. Se o Android pedir, permita que o navegador ou o gerenciador de arquivos instale apps dessa origem. Conceda essa permissão apenas ao app usado para baixar o arquivo e revogue depois da instalação.
4. Confirme a instalação e abra o ICNDY.

Este é um APK instalado manualmente (sideload), distribuído pelas GitHub Releases, e não um app da Google Play. Os textos do Android podem variar conforme o aparelho e a versão do sistema.

## Antes da primeira release pública

O repositório precisa conter o código-fonte do app, e o app precisa ser testado em um emulador ou aparelho Android. Em especial, verifique o fluxo completo de treino, pausar/retomar e recuperação do cronômetro, o histórico salvo, o comportamento das sequências e o backup/restauração. Passar em TypeScript, lint, testes unitários e Expo Doctor é necessário, mas não substitui o teste em aparelho.

## Automação de release

Um workflow do GitHub Actions valida o projeto, gera um APK Android pelo Expo Application Services (EAS) e anexa o `ICNDY.apk` a uma GitHub Release quando uma tag de versão, como `v0.1.0`, é enviada.

Configuração única:

1. Vincule o app a um projeto EAS na raiz do projeto com `npx eas-cli@latest login` e `npx eas-cli@latest init`. Faça commit da configuração `extra.eas.projectId` resultante.
2. Confirme que o `eas.json` tem um perfil `preview` com `distribution: "internal"` e `android.buildType: "apk"`.
3. Crie um token de acesso do Expo e adicione-o ao repositório do GitHub em **Settings → Secrets and variables → Actions → New repository secret**. O nome do segredo é `EXPO_TOKEN`. Nunca grave o token no código, no `app.json` ou em um `.env` versionado.
4. Envie para a `main` o código-fonte completo e revisado, junto com o lockfile.
5. Depois do teste manual no Android e das verificações do repositório, crie e envie a tag de versão:

   ```bash
   git checkout main
   git pull --ff-only
   git tag v0.1.0
   git push origin v0.1.0
   ```

6. Acompanhe a execução na aba **Actions** do repositório. A release só é publicada se as verificações de qualidade, o build no EAS e o download do APK tiverem sucesso.

Para cada release seguinte, use uma nova tag de versão (por exemplo `v0.1.1`). Nunca reutilize uma tag de release existente.

## Desenvolvimento

### Estrutura do projeto

```
src/
├── app/           # Rotas do Expo Router (cada arquivo é uma tela; _layout.tsx define navegadores)
│   ├── (tabs)/    # Abas: Início e Progresso
│   ├── workout/   # Configurar (setup), treino ativo (active) e resumo (summary)
│   ├── session/   # Detalhe e edição de um treino salvo ([id])
│   ├── onboarding.tsx
│   └── settings.tsx
├── components/    # Componentes de UI reutilizáveis (botões, cards, toast, barra de abas etc.)
├── features/      # Componentes e lógica de tela, agrupados por área (home, workout, session, progress, settings, onboarding)
├── domain/        # Regras de negócio puras: pontuação, sequências, ritmo, splits, timer, conquistas, datas
├── database/      # SQLite (expo-sqlite): client.ts, repositories.ts e migrations.ts (migrações versionadas)
├── services/      # Integrações com o dispositivo: notificações, sons, backup e formato do backup
├── context/       # Providers de estado global
└── theme/         # Cores, tipografia e tokens de design
```

Regra geral: tudo que for rota fica em `src/app/`; o restante (componentes, hooks, utilitários) fica fora dessa pasta. Regras de negócio ficam em `src/domain/`, sem dependência de UI, para que sejam testáveis com Vitest em `tests/`.

### Comandos

```bash
npm ci                    # instala as dependências a partir do package-lock.json
npx expo start            # inicia o servidor de desenvolvimento
npm run test              # roda os testes (vitest run)
npx tsc --noEmit          # verificação de tipos
npm run lint              # lint (expo lint)
npx expo-doctor           # diagnóstico de dependências e configuração
npx expo install --fix    # corrige versões incompatíveis de pacotes
```

Para adicionar dependências, use `npx expo install <pacote>`, que escolhe versões compatíveis com o SDK do Expo.

### Módulos nativos e builds

O app usa módulos com código nativo, como `expo-sqlite`, `expo-notifications`, `expo-audio` e `expo-linear-gradient`. Por isso:

- **`expo-audio` e `expo-linear-gradient` exigem um novo build.** Eles não funcionam com um build antigo do app. Gere um build com o EAS:

  ```bash
  npx eas-cli@latest build --profile preview --platform android
  ```

  Ou use um development build (`eas build --profile development`, ou `npx expo run:android` localmente).
- **O Expo Go pode não suportar o app.** Ele inclui apenas os módulos nativos embutidos no próprio Expo Go, então som, notificações ou banco local podem falhar. Teste em um development build ou no APK.
- O APK de release precisa abrir sem servidor de desenvolvimento e continuar funcionando offline depois de instalado.

## Privacidade e dados

Os registros de treino ficam no aparelho. Use a exportação em JSON, dentro do app, para manter seu próprio backup. Restaurar um backup substitui os registros locais, então inspecione o arquivo e a tela de confirmação antes de prosseguir.

O ICNDY é um app de acompanhamento de treinos, não uma orientação médica. Escolha variações de exercícios compatíveis com sua capacidade e pare se algum exercício causar dor ou sintomas preocupantes.
