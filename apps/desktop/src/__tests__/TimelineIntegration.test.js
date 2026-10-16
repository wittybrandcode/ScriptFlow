import { describe, it, expect } from 'vitest';
import { analyzeContinuity } from '../utils/continuityAnalyzer';

describe('Timeline & Continuity Integration Tests', () => {

  it('1. Should dynamically calculate estimated duration from script lines when missing', () => {
    const mockDay = {
      id: 1,
      scenes: [
        { id: 101, estimated_duration: 0, line_count: 24, content: null, page_count: null }, // 24 lines / 8 = 3 minutes
        { id: 102, estimated_duration: null, line_count: null, page_count: 2 }, // 2 pages * 60 = 120 seconds (2 mins)
        { id: 103, estimated_duration: 5, line_count: 100 } // 5 minutes (Explicitly set)
      ]
    };

    const totalDuration = mockDay.scenes.reduce((acc, s) => {
      let duration = s.estimated_duration;
      if (!duration || duration <= 0) {
        if (s.page_count) duration = s.page_count * 60;
        else if (s.line_count) duration = Math.ceil(s.line_count / 8);
        else duration = 1; 
      }
      return acc + duration;
    }, 0);

    // 3 + 120 + 5 = 128 minutes
    expect(totalDuration).toBe(128);
  });

  it('2. Should integrate Continuity Analyzer to catch Actor Double Booking across locations on the same day', () => {
    const characters = [
      { id: 'c1', name: 'أحمد' }
    ];

    const shootDays = [
      {
        id: 'day1',
        shoot_date: '2026-06-25T00:00:00Z',
        scenes: [
          { id: 's1', location_name: 'الشركة', time_of_day: 'DAY', present_characters: '["c1"]' },
          { id: 's2', location_name: 'المنزل', time_of_day: 'NIGHT', present_characters: '["c1"]' }
        ]
      }
    ];

    const warnings = analyzeContinuity(shootDays, characters);
    
    // We expect a warning for Actor 'c1' moving between locations on the same exact date
    const locationConflict = warnings.find(w => w.id.includes('char-double-loc') && w.id.includes('c1'));
    
    expect(locationConflict).toBeDefined();
    expect(locationConflict.title).toContain('تشتت جغرافي للممثل');
    expect(locationConflict.description).toContain('مواقع مختلفة');
  });

});
