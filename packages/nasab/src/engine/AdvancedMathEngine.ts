import Fraction from '../core/Fraction';
import { CalculationResult } from './BaseEngine';

export class AdvancedMathEngine {
  /**
   * Calculates the Greatest Common Divisor (GCD).
   */
  public static gcd(a: number | bigint, b: number | bigint): bigint {
    return Fraction.gcd(BigInt(a), BigInt(b));
  }

  /**
   * Calculates the Least Common Multiple (LCM).
   */
  public static lcm(a: number | bigint, b: number | bigint): bigint {
    return Fraction.lcm(BigInt(a), BigInt(b));
  }

  /**
   * Calculates the Least Common Multiple for an array of numbers.
   */
  public static lcmArray(numbers: (number | bigint)[]): bigint {
    if (numbers.length === 0) return 1n;
    return numbers.reduce<bigint>((acc, val) => AdvancedMathEngine.lcm(acc, val), BigInt(numbers[0]));
  }

  /**
   * Calculates the total sum of shares to determine if Awl or Radd is needed.
   * Modifies the result object with the correct baseOrigin.
   */
  public static processBaseOrigin(result: CalculationResult): number {
    const fractions = Object.values(result.shares)
      .filter(s => s.type === 'FARD' || s.type === 'FARD_SHARED' || s.type === 'FARD_PLUS_ASABA')
      .map(s => new Fraction(s.fraction));

    if (fractions.length === 0) {
      result.baseOrigin = 1;
      return 0; // Total shares is 0 (only Asaba exists)
    }

    const denominators = fractions.map(f => f.d);
    result.baseOrigin = Number(this.lcmArray(denominators));

    const sum = fractions.reduce((acc, val) => acc.add(val), new Fraction(0));
    return sum.valueOf(); // Returns the decimal value to check if > 1 (Awl) or < 1 (Radd)
  }

  /**
   * Applies Awl (العول) when shares exceed 1.
   */
  public static applyAwl(result: CalculationResult): CalculationResult {
    const fractions = Object.values(result.shares)
      .filter(s => s.type === 'FARD' || s.type === 'FARD_SHARED' || s.type === 'FARD_PLUS_ASABA')
      .map(s => new Fraction(s.fraction));

    let sumNumerators = 0n;
    const origin = BigInt(result.baseOrigin || 1);
    for (const frac of fractions) {
      // Convert fraction to have denominator = baseOrigin
      sumNumerators += frac.n * (origin / frac.d);
    }

    result.awlOrigin = Number(sumNumerators);
    
    // Update fractions to reflect Awl
    for (const key in result.shares) {
      const type = result.shares[key].type;
      if (type === 'FARD' || type === 'FARD_SHARED' || type === 'FARD_PLUS_ASABA') {
        const oldFrac = new Fraction(result.shares[key].fraction);
        const newNumerator = oldFrac.n * (origin / oldFrac.d);
        result.shares[key].fraction = `${newNumerator}/${result.awlOrigin}`;
        if (type !== 'FARD_PLUS_ASABA') {
          result.shares[key].type = 'FARD_AWL';
        }
      }
    }

    return result;
  }

  /**
   * Evaluates Tashih (تصحيح) — adjusts the origin so that all shares have a
   * common denominator and each heir's portion is an integer at that denominator.
   *
   * In the current system, per-individual division is already done by SharesEngine,
   * so tashih is only needed when asaba shares have varied denominators after
   * distribution. This method finds the LCM of all share denominators and expresses
   * all fractions with that common denominator.
   */
  public static applyTashih(result: CalculationResult): CalculationResult {
    const currentOrigin = BigInt(result.awlOrigin || result.baseOrigin || 1);

    // Collect all unique denominators from all shares
    const allDenominators = new Set<bigint>();
    for (const key in result.shares) {
      const frac = new Fraction(result.shares[key].fraction);
      allDenominators.add(frac.d);
    }

    // Remove 1 from denominators (means integer)
    allDenominators.delete(1n);

    if (allDenominators.size === 0) return result;

    const lcmOfDenominators = this.lcmArray(Array.from(allDenominators));

    // If the LCM equals the current origin, no tashih needed
    if (lcmOfDenominators <= currentOrigin) return result;

    // Express all shares with the new common denominator
    for (const key in result.shares) {
      const frac = new Fraction(result.shares[key].fraction);
      if (frac.d === lcmOfDenominators) continue;
      const newNumerator = frac.n * (lcmOfDenominators / frac.d);
      result.shares[key].fraction = `${newNumerator}/${lcmOfDenominators}`;
    }

    result.tashihOrigin = Number(lcmOfDenominators);

    return result;
  }
}
