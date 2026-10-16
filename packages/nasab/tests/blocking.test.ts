import { describe, it, expect } from 'vitest';
import { BlockingEngine } from '../src/engine/BlockingEngine';
import { Heir } from '../src/types/Kinship';

describe('BlockingEngine', () => {
  it('should block Grandson, Brothers, and Uncles when Son exists', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'SON', gender: 'MALE' },
      { id: '2', type: 'SON_OF_SON', gender: 'MALE' },
      { id: '3', type: 'FULL_BROTHER', gender: 'MALE' },
      { id: '4', type: 'FULL_UNCLE', gender: 'MALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    
    expect(result.find(h => h.type === 'SON')?.isBlocked).toBeFalsy();
    expect(result.find(h => h.type === 'SON_OF_SON')?.isBlocked).toBe(true);
    expect(result.find(h => h.type === 'FULL_BROTHER')?.isBlocked).toBe(true);
    expect(result.find(h => h.type === 'FULL_UNCLE')?.isBlocked).toBe(true);
  });

  it('should block Grandfather when Father exists', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'FATHER', gender: 'MALE' },
      { id: '2', type: 'GRANDFATHER', gender: 'MALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    expect(result.find(h => h.type === 'FATHER')?.isBlocked).toBeFalsy();
    expect(result.find(h => h.type === 'GRANDFATHER')?.isBlocked).toBe(true);
  });

  it('should let Daughter and Granddaughter inherit together (no blocking) if < 2 Daughters', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: '2', type: 'DAUGHTER_OF_SON', gender: 'FEMALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    expect(result.find(h => h.type === 'DAUGHTER')?.isBlocked).toBeFalsy();
    expect(result.find(h => h.type === 'DAUGHTER_OF_SON')?.isBlocked).toBeFalsy();
  });

  it('should block Granddaughter if >= 2 Daughters exist', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: '2', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: '3', type: 'DAUGHTER_OF_SON', gender: 'FEMALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    expect(result.find(h => h.type === 'DAUGHTER_OF_SON')?.isBlocked).toBe(true);
  });
});
