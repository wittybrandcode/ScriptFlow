import { describe, it, expect, beforeEach, vi } from 'vitest';
import { measureBlockLines, groupBlocksByPage, GRID } from '../TextMeasurementEngine';
import { SCENE_FIXTURE_BLOCKS } from './fixtures';

describe('TextMeasurementEngine (Phase 0 Baseline Shield)', () => {
  beforeEach(() => {
    // Mock the canvas API to be deterministic for snapshots
    const mockContext = {
      font: '',
      measureText: vi.fn((text: string) => {
        // Deterministic measurement: 10px per character
        return { width: text.length * 10 };
      }),
    };

    // Override document.createElement specifically for 'canvas'
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      if (tagName.toLowerCase() === 'canvas') {
        return {
          getContext: vi.fn(() => mockContext)
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName, options);
    });
  });

  it('measureBlockLines should calculate deterministic lines based on char count', () => {
    const text = 'هذا نص اختباري طويل نسبيا للتأكد من حساب الأسطر بشكل دقيق في محرك القياس';
    // 73 chars * 10px = 730px. 
    // Default action width: CONTENT_WIDTH (602px). 
    // 730 > 602, so it should wrap into at least 2 lines.

    const lines = measureBlockLines(text, 'ACTION');
    expect(lines).toBeGreaterThanOrEqual(2);
    expect(lines).toMatchInlineSnapshot(`2`);
  });

  it('measureBlockLines should add extra margin for specific nodes (e.g. CHARACTER)', () => {
    const linesAction = measureBlockLines('أحمد', 'ACTION');
    const linesCharacter = measureBlockLines('أحمد', 'CHARACTER');

    // CHARACTER has margin, so it should be +1 line
    expect(linesCharacter).toBe(linesAction + 1);
    expect(linesAction).toMatchInlineSnapshot(`1`);
    expect(linesCharacter).toMatchInlineSnapshot(`2`);
  });

  it('groupBlocksByPage should paginate the fixture deterministically', () => {
    // We pass 1 scene line count (header takes 2 units usually).
    // The fixture has 20 blocks.
    
    // Call groupBlocksByPage
    const { pages, totalPages } = groupBlocksByPage(SCENE_FIXTURE_BLOCKS, 1);
    
    // Basic assertions
    expect(totalPages).toBeGreaterThan(0);
    expect(pages.length).toBe(totalPages);
    
    // Detailed snapshot of pagination output. 
    // This is the CORE regression shield. If any CSS logic or line height changes,
    // this snapshot will fail, preventing accidental page breaks.
    expect(pages).toMatchSnapshot();
  });
});
