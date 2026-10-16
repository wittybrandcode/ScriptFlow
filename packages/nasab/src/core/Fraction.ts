export class Fraction {
  n: bigint;
  d: bigint;

  constructor(num: string | number | bigint | Fraction, den?: number | string | bigint) {
    if (num instanceof Fraction) {
      this.n = num.n;
      this.d = num.d;
      return;
    }
    
    if (typeof num === 'string' && den === undefined) {
      if (num.includes('/')) {
        const parts = num.split('/');
        this.n = BigInt(parts[0]);
        this.d = BigInt(parts[1]);
      } else {
        this.n = BigInt(Math.floor(Number(num)));
        this.d = 1n;
      }
    } else {
       // if num is undefined etc.
       if (num === undefined || num === null) {
          this.n = 0n;
       } else if (typeof num === 'number') {
          this.n = BigInt(Math.floor(num));
       } else {
          this.n = BigInt(num);
       }
       
       if (den === undefined || den === null) {
          this.d = 1n;
       } else if (typeof den === 'number') {
          this.d = BigInt(Math.floor(den));
       } else {
          this.d = BigInt(den);
       }
    }

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
    return (a * b) / Fraction.gcd(a, b);
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
