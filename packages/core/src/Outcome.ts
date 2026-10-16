import { DomainError } from './errors/DomainError.js';

export class Outcome<T, E = DomainError> {
  private constructor(
    public readonly success: boolean,
    public readonly value?: T,
    public readonly error?: E
  ) {
    if (success && error) {
      throw new Error("InvalidOutcome: Cannot be successful and have an error.");
    }
    if (!success && value !== undefined) {
      throw new Error("InvalidOutcome: Cannot fail and have a value.");
    }
  }

  public static ok<T>(value?: T): Outcome<T, never> {
    return new Outcome<T, never>(true, value);
  }

  public static fail<E>(error: E): Outcome<never, E> {
    return new Outcome<never, E>(false, undefined, error);
  }

  public getValue(): T {
    if (!this.success) {
      throw new Error("Cannot get the value of an error outcome.");
    }
    return this.value as T;
  }

  public getError(): E {
    if (this.success) {
      throw new Error("Cannot get the error of a success outcome.");
    }
    return this.error as E;
  }
}
