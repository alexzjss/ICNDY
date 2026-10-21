import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';

export type LogLevel = 'info' | 'warn' | 'error';

export type LogEntry = {
  at: string;
  level: LogLevel;
  message: string;
  detail?: string;
};

export const MAX_LOG_ENTRIES = 200;
const MAX_DETAIL_LENGTH = 4000;
const LOG_FILE_NAME = 'icndy-log.json';
const LEVELS: readonly LogLevel[] = ['info', 'warn', 'error'];
const LEVEL_LABEL: Record<LogLevel, string> = { info: 'INFO ', warn: 'AVISO', error: 'ERRO ' };

/* ───────────── Lógica pura (testada em tests/log.test.ts) ───────────── */

export const makeEntry = (level: LogLevel, message: string, detail?: string, at: string = new Date().toISOString()): LogEntry => {
  const entry: LogEntry = { at, level, message };
  if (detail) entry.detail = detail.slice(0, MAX_DETAIL_LENGTH);
  return entry;
};

/** Acrescenta uma entrada e mantém só as `max` mais recentes. Não altera o array recebido. */
export const appendEntry = (entries: readonly LogEntry[], entry: LogEntry, max: number = MAX_LOG_ENTRIES): LogEntry[] => {
  const next = [...entries, entry];
  return next.length > max ? next.slice(next.length - max) : next;
};

/** Descarta dados inválidos vindos do arquivo e aplica o limite. */
export const parseEntries = (raw: unknown, max: number = MAX_LOG_ENTRIES): LogEntry[] => {
  if (!Array.isArray(raw)) return [];
  const valid: LogEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.at !== 'string' || typeof candidate.message !== 'string') continue;
    if (typeof candidate.level !== 'string' || !LEVELS.includes(candidate.level as LogLevel)) continue;
    valid.push(makeEntry(candidate.level as LogLevel, candidate.message, typeof candidate.detail === 'string' ? candidate.detail : undefined, candidate.at));
  }
  return valid.length > max ? valid.slice(valid.length - max) : valid;
};

/** Converte qualquer valor lançado em mensagem curta e detalhe (stack, quando houver). */
export const describeError = (error: unknown): { message: string; detail?: string } => {
  if (error instanceof Error) return { message: error.message || error.name || 'Erro desconhecido', detail: error.stack };
  if (typeof error === 'string') return { message: error };
  try {
    return { message: JSON.stringify(error) ?? String(error) };
  } catch {
    return { message: String(error) };
  }
};

/** Texto legível para compartilhar: cabeçalho e uma entrada por bloco, do mais antigo ao mais recente. */
export const formatLogText = (entries: readonly LogEntry[], info: { generatedAt: string; appVersion?: string }): string => {
  const lines = [
    'ICNDY · log de diagnóstico',
    `Gerado em: ${info.generatedAt}`,
    `Versão do app: ${info.appVersion ?? 'desconhecida'}`,
    `Entradas: ${entries.length} (máximo ${MAX_LOG_ENTRIES})`,
    '',
  ];
  if (entries.length === 0) lines.push('Nenhum evento registrado.');
  for (const entry of entries) {
    lines.push(`[${entry.at}] ${LEVEL_LABEL[entry.level]} ${entry.message}`);
    if (entry.detail) lines.push(...entry.detail.split('\n').map((line) => `    ${line}`));
  }
  return `${lines.join('\n')}\n`;
};

/* ───────────── Persistência (expo-file-system) ───────────── */

let cache: LogEntry[] | undefined;
let loading: Promise<LogEntry[]> | undefined;
// Escritas são serializadas para não intercalar gravações do mesmo arquivo.
let queue: Promise<void> = Promise.resolve();

const logFileUri = () => (FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${LOG_FILE_NAME}` : null);

const loadEntries = (): Promise<LogEntry[]> => {
  if (cache) return Promise.resolve(cache);
  loading ??= (async () => {
    let loaded: LogEntry[] = [];
    try {
      const uri = logFileUri();
      if (uri && (await FileSystem.getInfoAsync(uri)).exists) {
        loaded = parseEntries(JSON.parse(await FileSystem.readAsStringAsync(uri)));
      }
    } catch {
      // Arquivo corrompido: recomeça do zero.
      loaded = [];
    }
    cache ??= loaded;
    return cache;
  })();
  return loading;
};

const persist = async (entries: LogEntry[]) => {
  const uri = logFileUri();
  if (!uri) return;
  try {
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(entries));
  } catch {
    // Log nunca pode derrubar o app.
  }
};

const enqueue = (entry: LogEntry) => {
  queue = queue
    .then(async () => {
      const next = appendEntry(await loadEntries(), entry);
      cache = next;
      await persist(next);
    })
    .catch(() => undefined);
};

export const logInfo = (message: string, detail?: string) => enqueue(makeEntry('info', message, detail));

export const logWarn = (message: string, detail?: string) => enqueue(makeEntry('warn', message, detail));

export const logError = (error: unknown, context?: string) => {
  const { message, detail } = describeError(error);
  enqueue(makeEntry('error', context ? `${context}: ${message}` : message, detail));
};

export const getLogEntries = async (): Promise<LogEntry[]> => {
  await queue;
  return [...(await loadEntries())];
};

/** Gera o .txt do log e abre o compartilhamento. Lança erro se não for possível compartilhar. */
export const exportLog = async (): Promise<string> => {
  const entries = await getLogEntries();
  const generatedAt = new Date().toISOString();
  const text = formatLogText(entries, { generatedAt, appVersion: Constants.expoConfig?.version });
  const dir = FileSystem.cacheDirectory;
  if (!dir) throw new Error('Armazenamento temporário indisponível.');
  const stamp = generatedAt.slice(0, 19).replace(/[:T]/g, '-');
  const uri = `${dir}icndy-log-${stamp}.txt`;
  await FileSystem.writeAsStringAsync(uri, text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  await Sharing.shareAsync(uri, { mimeType: 'text/plain', UTI: 'public.plain-text', dialogTitle: 'Compartilhar log do ICNDY' });
  return uri;
};

let globalHandlersInstalled = false;

/** Registra erros JS não tratados no log, preservando o handler anterior (ex. redbox em dev). */
export const installGlobalErrorLogging = () => {
  if (globalHandlersInstalled || typeof ErrorUtils === 'undefined') return;
  globalHandlersInstalled = true;
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logError(error, isFatal ? 'Erro fatal não tratado' : 'Erro não tratado');
    previous?.(error, isFatal);
  });
};
