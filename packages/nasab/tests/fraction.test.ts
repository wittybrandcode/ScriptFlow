import { describe, it, expect } from 'vitest';
import { Fraction } from '../src/core/Fraction';

describe('Fraction Core Engine', () => {
  it('should parse integers correctly', () => {
    const f = new Fraction(5);
    expect(f.n).toBe(5n);
    expect(f.d).toBe(1n);
    expect(f.toString()).toBe('5/1');
  });

  it('should parse fractions strings correctly', () => {
    const f = new Fraction('3/4');
    expect(f.n).toBe(3n);
    expect(f.d).toBe(4n);
  });

  it('should parse decimals accurately without truncation', () => {
    const f1 = new Fraction(0.5);
    expect(f1.n).toBe(1n);
    expect(f1.d).toBe(2n);
    expect(f1.toString()).toBe('1/2');

    const f2 = new Fraction(0.75);
    expect(f2.n).toBe(3n);
    expect(f2.d).toBe(4n);

    const f3 = new Fraction('1.25');
    expect(f3.n).toBe(5n);
    expect(f3.d).toBe(4n);

    const f4 = new Fraction(-0.2);
    expect(f4.n).toBe(-1n);
    expect(f4.d).toBe(5n);
  });

  it('should calculate LCM and GCD with BigInt accurately', () => {
    expect(Fraction.gcd(12n, 18n)).toBe(6n);
    expect(Fraction.lcm(12n, 18n)).toBe(36n);
    expect(Fraction.lcm(-4n, 6n)).toBe(12n);
  });

  it('should perform arithmetic operations correctly', () => {
    const a = new Fraction('1/3');
    const b = new Fraction('1/6');
    
    // 1/3 + 1/6 = 3/6 = 1/2
    const sum = a.add(b);
    expect(sum.toString()).toBe('1/2');

    // 1/3 - 1/6 = 1/6
    const diff = a.sub(b);
    expect(diff.toString()).toBe('1/6');

    // 1/3 * 1/6 = 1/18
    const prod = a.mul(b);
    expect(prod.toString()).toBe('1/18');

    // 1/3 / 1/6 = 2
    const quot = a.div(b);
    expect(quot.toString()).toBe('2/1');
  });

  it('should throw on division by zero', () => {
    expect(() => new Fraction(1, 0)).toThrow('Division by zero');
    expect(() => new Fraction('1/0')).toThrow('Division by zero');
  });
});

