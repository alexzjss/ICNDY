import { describe, expect, it } from 'vitest';
import { LATEST_SCHEMA_VERSION, MIGRATIONS, pendingMigrations } from '../src/database/migrations';

describe('migrations', () => {
  it('runs everything on a fresh database', () => {
    expect(pendingMigrations(0).map((m) => m.version)).toEqual([1, 2, 3]);
  });
  it('runs v2 and v3 on an existing v1 database', () => {
    expect(pendingMigrations(1).map((m) => m.version)).toEqual([2, 3]);
    expect(pendingMigrations(2).map((m) => m.version)).toEqual([3]);
  });
  it('runs nothing when up to date', () => {
    expect(pendingMigrations(LATEST_SCHEMA_VERSION)).toEqual([]);
  });
  it('has strictly increasing versions and the v2 columns', () => {
    expect(MIGRATIONS.map((m) => m.version)).toEqual([1, 2, 3]);
    const v2 = MIGRATIONS[1].statements.join(' ');
    expect(v2).toContain('round_splits_json');
    expect(v2).toContain('rpe');
    expect(v2).toContain('partial_json');
  });
  it('v3 adds target_rounds', () => {
    expect(MIGRATIONS[2].statements.join(' ')).toContain('ADD COLUMN target_rounds INTEGER');
  });
});
