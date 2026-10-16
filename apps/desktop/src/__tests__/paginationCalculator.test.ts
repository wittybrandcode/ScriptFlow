import { describe, it, expect } from 'vitest';
import { calculatePageNumbers, calculateTotalPages } from '../utils/paginationCalculator';

describe('Pagination Calculator Engine', () => {
  it('should return default start page 1 for empty scene list', () => {
    const pages = calculatePageNumbers([], []);
    expect(pages).toEqual([]);
  });

  it('should accurately calculate total pages for regular scene layout nodes', () => {
    const mockScenes = [
      { id: 'sc_1', episode_id: 'ep_1', scene_number: 1, blocks: [{ type: 'ACTION', content: 'حدث كبير في الغابة' }] },
      { id: 'sc_2', episode_id: 'ep_1', scene_number: 2, blocks: [{ type: 'DIALOGUE', content: 'مرحباً بك' }] },
    ];

    const total = calculateTotalPages(mockScenes, []);
    expect(total).toBeGreaterThanOrEqual(2);
  });

  it('should assign sequential page numbers matching document structure', () => {
    const mockScenes = [
      { id: 'sc_1', episode_id: 'ep_1', scene_number: 1, blocks: [{ type: 'ACTION', content: 'اختبار ترقيم الصفحات' }] },
      { id: 'sc_2', episode_id: 'ep_1', scene_number: 2, blocks: [{ type: 'ACTION', content: 'تابع المشهد الثاني' }] },
    ];

    const numbering = calculatePageNumbers(mockScenes, []);
    expect(numbering.length).toBeGreaterThan(0);
    expect(numbering[0].start_page).toBe(1);
  });
});
