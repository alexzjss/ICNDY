import { describe, expect, it, vi } from 'vitest';

// Módulos nativos não rodam no Node: a lógica testada é pura.
vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: null,
  cacheDirectory: null,
  getInfoAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
  writeAsStringAsync: vi.fn(),
}));
vi.mock('expo-sharing', () => ({ isAvailableAsync: vi.fn(), shareAsync: vi.fn() }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));

import {
  MAX_LOG_ENTRIES,
  appendEntry,
  describeError,
  formatLogText,
  makeEntry,
  parseEntries,
  type LogEntry,
} from '../src/services/log';

const entry = (n: number): LogEntry => makeEntry('info', `evento ${n}`, undefined, `2026-01-01T00:00:${String(n % 60).padStart(2, '0')}.000Z`);

describe('appendEntry', () => {
  it('acrescenta sem alterar o array original', () => {
    const base = [entry(1)];
    const next = appendEntry(base, entry(2));
    expect(next.map((e) => e.message)).toEqual(['evento 1', 'evento 2']);
    expect(base).toHaveLength(1);
  });

  it('mantém no máximo 200 entradas, descartando as mais antigas', () => {
    let entries: LogEntry[] = [];
    for (let i = 1; i <= MAX_LOG_ENTRIES + 25; i++) entries = appendEntry(entries, entry(i));
    expect(entries).toHaveLength(MAX_LOG_ENTRIES);
    expect(entries[0].message).toBe('evento 26');
    expect(entries.at(-1)?.message).toBe(`evento ${MAX_LOG_ENTRIES + 25}`);
  });

  it('respeita um limite customizado', () => {
    const entries = appendEntry(appendEntry([entry(1), entry(2)], entry(3), 2), entry(4), 2);
    expect(entries.map((e) => e.message)).toEqual(['evento 3', 'evento 4']);
  });
});

describe('parseEntries', () => {
  it('ignora itens inválidos e preserva os válidos', () => {
    const parsed = parseEntries([
      { at: '2026-01-01T00:00:00.000Z', level: 'warn', message: 'ok', detail: 'stack' },
      { at: '2026-01-01T00:00:00.000Z', level: 'debug', message: 'nível inválido' },
      { level: 'info', message: 'sem data' },
      null,
      'texto',
    ]);
    expect(parsed).toEqual([{ at: '2026-01-01T00:00:00.000Z', level: 'warn', message: 'ok', detail: 'stack' }]);
  });

  it('retorna vazio para conteúdo que não é uma lista', () => {
    expect(parseEntries({ foo: 1 })).toEqual([]);
    expect(parseEntries(null)).toEqual([]);
  });

  it('aplica o limite de entradas', () => {
    const raw = Array.from({ length: MAX_LOG_ENTRIES + 3 }, (_, i) => entry(i));
    expect(parseEntries(raw)).toHaveLength(MAX_LOG_ENTRIES);
  });
});

describe('makeEntry', () => {
  it('trunca detalhes muito longos', () => {
    const entryWithDetail = makeEntry('error', 'x', 'a'.repeat(10_000));
    expect(entryWithDetail.detail?.length).toBe(4000);
  });

  it('omite detail quando não informado', () => {
    expect(makeEntry('info', 'x')).not.toHaveProperty('detail');
  });
});

describe('describeError', () => {
  it('usa mensagem e stack de um Error', () => {
    const error = new Error('falhou');
    const described = describeError(error);
    expect(described.message).toBe('falhou');
    expect(described.detail).toBe(error.stack);
  });

  it('aceita strings e objetos arbitrários', () => {
    expect(describeError('boom')).toEqual({ message: 'boom' });
    expect(describeError({ code: 42 })).toEqual({ message: '{"code":42}' });
  });
});

describe('formatLogText', () => {
  it('gera cabeçalho, níveis e detalhes indentados', () => {
    const text = formatLogText(
      [makeEntry('error', 'Falha ao salvar', 'linha 1\nlinha 2', '2026-01-01T10:00:00.000Z'), makeEntry('info', 'Abriu o app', undefined, '2026-01-01T09:00:00.000Z')],
      { generatedAt: '2026-01-02T00:00:00.000Z', appVersion: '1.2.3' },
    );
    expect(text).toContain('ICNDY · log de diagnóstico');
    expect(text).toContain('Versão do app: 1.2.3');
    expect(text).toContain('Entradas: 2 (máximo 200)');
    expect(text).toContain('[2026-01-01T10:00:00.000Z] ERRO  Falha ao salvar');
    expect(text).toContain('    linha 1\n    linha 2');
    expect(text.indexOf('Falha ao salvar')).toBeLessThan(text.indexOf('Abriu o app'));
    expect(text.endsWith('\n')).toBe(true);
  });

  it('informa quando não há eventos', () => {
    const text = formatLogText([], { generatedAt: '2026-01-02T00:00:00.000Z' });
    expect(text).toContain('Versão do app: desconhecida');
    expect(text).toContain('Nenhum evento registrado.');
  });
});
