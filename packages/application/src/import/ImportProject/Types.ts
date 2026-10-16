export type ImportMode = 'COPY' | 'OVERWRITE' | 'MERGE';

export interface MediaProcessor {
  process(scenarioId: string, items: any, mappings: Array<{field: string, prefix: string}>): Promise<void>;
}

export interface ImportOptions {
  mode: ImportMode;
  conflictScenarioId?: string | null;
  onProgress?: (progress: number, statusText: string) => void;
  mediaProcessor?: MediaProcessor;
}

export interface ImportResult {
  success: boolean;
  scenarioId?: string;
  error?: string;
}

export interface ImportStrategy {
  /**
   * Identifies if this strategy can handle the given file or raw data payload.
   */
  canHandle(payload: unknown): boolean;
  
  /**
   * Parses the raw data and transforms it into the standard ScriptFlow internal JSON structure.
   */
  parse(payload: unknown): Promise<any>;
}
