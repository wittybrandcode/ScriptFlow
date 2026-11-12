function parseDecimal(val: string | number | bigint): { n: bigint; d: bigint } {
  if (typeof val === 'bigint') {
    return { n: val, d: 1n };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { n: BigInt(val), d: 1n };
    }
    val = val.toString();
  }
  const str = String(val).trim();
  if (str.includes('/')) {
    const [numPart, denPart] = str.split('/');
    const parsedNum = parseDecimal(numPart);
    const parsedDen = parseDecimal(denPart);
    return {
      n: parsedNum.n * parsedDen.d,
      d: parsedNum.d * parsedDen.n
    };
  }
  if (str.includes('.')) {
    const isNegative = str.startsWith('-');
    const cleanStr = isNegative ? str.slice(1) : str;
    const [intPart, decPart] = cleanStr.split('.');
    const decLen = decPart.length;
    const denominator = 10n ** BigInt(decLen);
    const numerator = BigInt(intPart || '0') * denominator + BigInt(decPart || '0');
    return {
      n: isNegative ? -numerator : numerator,
      d: denominator
    };
  }
  return { n: BigInt(str || '0'), d: 1n };
}

export class Fraction {
  n: bigint;
  d: bigint;

  constructor(num?: string | number | bigint | Fraction | null, den?: number | string | bigint | null) {
    if (num instanceof Fraction) {
      this.n = num.n;
      this.d = num.d;
      return;
    }
    
    if (num === undefined || num === null) {
      this.n = 0n;
      this.d = 1n;
      return;
    }

    const parsedNum = parseDecimal(num);
    const parsedDen = den !== undefined && den !== null ? parseDecimal(den) : { n: 1n, d: 1n };

    this.n = parsedNum.n * parsedDen.d;
    this.d = parsedNum.d * parsedDen.n;

    if (this.d === 0n) {
      throw new Error("Division by zero");
    }

    if (this.d < 0n) {
      this.n = -this.n;
      this.d = -this.d;
    }

    this.simplify();
  }

  private simplify(): void {
    if (this.n === 0n) {
      this.d = 1n;
      return;
    }
    const gcd = Fraction.gcd(this.n < 0n ? -this.n : this.n, this.d);
    this.n /= gcd;
    this.d /= gcd;
  }

  static gcd(a: bigint, b: bigint): bigint {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  static lcm(a: bigint, b: bigint): bigint {
    if (a === 0n || b === 0n) return 0n;
    const absA = a < 0n ? -a : a;
    const absB = b < 0n ? -b : b;
    return (absA * absB) / Fraction.gcd(absA, absB);
  }

  add(other: Fraction | string | number | bigint): Fraction {
    const o = new Fraction(other);
    const lcm = Fraction.lcm(this.d, o.d);
    const num = this.n * (lcm / this.d) + o.n * (lcm / o.d);
    return new Fraction(num, lcm);
  }

  sub(other: Fraction | string | number | bigint): Fraction {
    const o = new Fraction(other);
    const lcm = Fraction.lcm(this.d, o.d);
    const num = this.n * (lcm / this.d) - o.n * (lcm / o.d);
    return new Fraction(num, lcm);
  }

  mul(other: Fraction | string | number | bigint): Fraction {
    const o = new Fraction(other);
    return new Fraction(this.n * o.n, this.d * o.d);
  }

  div(other: Fraction | string | number | bigint): Fraction {
    const o = new Fraction(other);
    return new Fraction(this.n * o.d, this.d * o.n);
  }

  compare(other: Fraction | string | number | bigint): number {
    const o = new Fraction(other);
    const lcm = Fraction.lcm(this.d, o.d);
    const val1 = this.n * (lcm / this.d);
    const val2 = o.n * (lcm / o.d);
    if (val1 < val2) return -1;
    if (val1 > val2) return 1;
    return 0;
  }

  toFraction(_excludeWhole?: boolean): string {
    if (this.d === 1n) {
      return this.n.toString();
    }
    return `${this.n}/${this.d}`;
  }

  toString(): string {
    return `${this.n}/${this.d}`;
  }

  valueOf(): number {
    return Number(this.n) / Number(this.d);
  }
}

export default Fraction;
