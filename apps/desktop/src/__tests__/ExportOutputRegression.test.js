import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToPDF } from '../utils/exportPDF';

describe('Export Output Regression', () => {
  let mockIframe;

  beforeEach(() => {
    // Mock the Iframe creation
    mockIframe = {
      style: {},
      contentWindow: {
        focus: vi.fn(),
        print: vi.fn()
      },
      contentDocument: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn()
      }
    };
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'iframe') return mockIframe;
      return document.createElement(tagName);
    });
    
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'scriptflow-print-iframe') return null;
      return null;
    });
    
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    
    // Mock fetch for font embedding
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve('url(/fonts/IBMPlexSansArabic_0.woff2)'),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      blob: () => Promise.resolve(new Blob([new ArrayBuffer(8)], { type: 'font/woff2' }))
    }));
  });

  it('should generate expected HTML for a basic scenario', async () => {
    const mockData = {
      scenario: { title: 'Test Scenario', writer_name: 'John Doe' },
      scenes: [
        { id: 's1', scene_number: 1, title: 'Opening', episode_id: null }
      ],
      characters: [],
      episodes: [],
      pageNumbering: []
    };

    const options = {
      exportType: 'SINGLE_PDF',
      exportLevel: 'PROJECT',
      exportSettings: {
        enableWatermark: true,
        watermarkText: 'DRAFT',
      },
      includeMasterCover: true
    };

    const result = await exportToPDF(mockData, options);

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    // Verify iframe was written to
    expect(mockIframe.contentDocument.write).toHaveBeenCalledTimes(1);
    
    const htmlOutput = mockIframe.contentDocument.write.mock.calls[0][0];
    
    // Check for Master Cover
    expect(htmlOutput).toContain('Test Scenario');
    expect(htmlOutput).toContain('John Doe');
    
    // Check for Watermark
    expect(htmlOutput).toContain('DRAFT');
    
    // Check for Strict Print CSS
    expect(htmlOutput).toContain('@page {');
    expect(htmlOutput).toContain('size: A4 portrait;');
    
    // Check for Font Embedding
    expect(htmlOutput).toContain('data:font/woff2;base64');
  });
});
