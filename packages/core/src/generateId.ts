import { customAlphabet } from 'nanoid';

export type EntityPrefix = 
  | 'prj' | 'epi' | 'chr' | 'loc' | 'crw' 
  | 'scn' | 'shd' | 'ton' | 'blk' | 'rel' 
  | 'asn' | 'tsk' | 'lim' | 'ldc' | 'rem' | 'pgn';

const generateAlphabet = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

export function generateId(prefix: EntityPrefix): string {
  return `${prefix}_${generateAlphabet()}`;
}
