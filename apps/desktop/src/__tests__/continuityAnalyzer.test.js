import { describe, it, expect } from 'vitest';
import { analyzeContinuity } from '../utils/continuityAnalyzer';

describe('analyzeContinuity', () => {
  const mockCharacters = [
    { id: 'chr_1', name: 'أحمد' },
    { id: 'chr_2', name: 'سارة' },
    { id: 'chr_3', name: 'خالد' },
  ];

  it('returns empty array when no shoot days', () => {
    expect(analyzeContinuity([], mockCharacters)).toEqual([]);
    expect(analyzeContinuity(null, mockCharacters)).toEqual([]);
  });

  it('returns empty array for shoot days with no scenes', () => {
    const days = [
      { id: 'd1', shoot_date: '2026-07-01', scenes: [] },
      { id: 'd2', shoot_date: '2026-07-02', scenes: [] },
    ];
    expect(analyzeContinuity(days, mockCharacters)).toEqual([]);
  });

  it('detects actor in multiple locations on same day', () => {
    const days = [
      {
        id: 'd1',
        shoot_date: '2026-07-01',
        scenes: [
          { id: 's1', location_name: 'فيلا الحاج', present_characters: '["chr_1"]', time_of_day: 'DAY' },
          { id: 's2', location_name: 'المقهى', present_characters: '["chr_1"]', time_of_day: 'DAY' },
        ]
      }
    ];
    const warnings = analyzeContinuity(days, mockCharacters);
    const actorWarning = warnings.find(w => w.category === 'actor');
    expect(actorWarning).toBeDefined();
    expect(actorWarning.type).toBe('warning');
    expect(actorWarning.title).toContain('أحمد');
  });

  it('does NOT warn when actor is in only one location', () => {
    const days = [
      {
        id: 'd1',
        shoot_date: '2026-07-01',
        scenes: [
          { id: 's1', location_name: 'فيلا الحاج', present_characters: '["chr_1"]', time_of_day: 'DAY' },
          { id: 's2', location_name: 'فيلا الحاج', present_characters: '["chr_1"]', time_of_day: 'DAY' },
        ]
      }
    ];
    const warnings = analyzeContinuity(days, mockCharacters);
    const actorWarning = warnings.find(w => w.category === 'actor');
    expect(actorWarning).toBeUndefined();
  });

  it('detects excessive location count (> 2)', () => {
    const days = [
      {
        id: 'd1',
        shoot_date: '2026-07-01',
        scenes: [
          { id: 's1', location_name: 'فيلا الحاج', present_characters: '[]', time_of_day: 'DAY' },
          { id: 's2', location_name: 'المقهى', present_characters: '[]', time_of_day: 'DAY' },
          { id: 's3', location_name: 'المسجد', present_characters: '[]', time_of_day: 'DAY' },
        ]
      }
    ];
    const warnings = analyzeContinuity(days, mockCharacters);
    const locWarning = warnings.find(w => w.category === 'location');
    expect(locWarning).toBeDefined();
    expect(locWarning.type).toBe('info');
  });

  it('detects day/night mix in same shoot day', () => {
    const days = [
      {
        id: 'd1',
        shoot_date: '2026-07-01',
        scenes: [
          { id: 's1', location_name: 'فيلا الحاج', present_characters: '[]', time_of_day: 'DAY' },
          { id: 's2', location_name: 'فيلا الحاج', present_characters: '[]', time_of_day: 'NIGHT' },
        ]
      }
    ];
    const warnings = analyzeContinuity(days, mockCharacters);
    const turnWarning = warnings.find(w => w.category === 'turnaround' && w.id.startsWith('day-night-mix'));
    expect(turnWarning).toBeDefined();
    expect(turnWarning.type).toBe('warning');
  });

  it('detects turnaround conflict between consecutive days', () => {
    const days = [
      {
        id: 'd1',
        shoot_date: '2026-07-01',
        scenes: [
          { id: 's1', location_name: 'فيلا الحاج', present_characters: '[]', time_of_day: 'NIGHT' },
        ]
      },
      {
        id: 'd2',
        shoot_date: '2026-07-02',
        scenes: [
          { id: 's2', location_name: 'المقهى', present_characters: '[]', time_of_day: 'DAY' },
        ]
      }
    ];
    const warnings = analyzeContinuity(days, mockCharacters);
    const turnaround = warnings.find(w => w.id.startsWith('turnaround-conflict'));
    expect(turnaround).toBeDefined();
    expect(turnaround.type).toBe('error');
  });

  it('does NOT generate turnaround conflict when next day starts at NIGHT', () => {
    const days = [
      {
        id: 'd1',
        shoot_date: '2026-07-01',
        scenes: [
          { id: 's1', location_name: 'فيلا', present_characters: '[]', time_of_day: 'NIGHT' },
        ]
      },
      {
        id: 'd2',
        shoot_date: '2026-07-02',
        scenes: [
          { id: 's2', location_name: 'فيلا', present_characters: '[]', time_of_day: 'NIGHT' },
        ]
      }
    ];
    const warnings = analyzeContinuity(days, mockCharacters);
    const turnaround = warnings.find(w => w.id.startsWith('turnaround-conflict'));
    expect(turnaround).toBeUndefined();
  });

  it('handles invalid present_characters JSON gracefully', () => {
    const days = [
      {
        id: 'd1',
        shoot_date: '2026-07-01',
        scenes: [
          { id: 's1', location_name: 'فيلا', present_characters: 'INVALID_JSON', time_of_day: 'DAY' },
        ]
      }
    ];
    const warnings = analyzeContinuity(days, mockCharacters);
    // Should not crash
    expect(Array.isArray(warnings)).toBe(true);
  });
});
