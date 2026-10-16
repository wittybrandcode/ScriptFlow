export enum ErrorCode {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTEGRITY = 'INTEGRITY',
  PERMISSION = 'PERMISSION',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  UNEXPECTED = 'UNEXPECTED'
}

export class DomainError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly cause?: any;

  constructor(params: { code: ErrorCode; message: string; details?: any; cause?: any }) {
    super(params.message);
    this.name = 'DomainError';
    this.code = params.code;
    this.details = params.details;
    this.cause = params.cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}
