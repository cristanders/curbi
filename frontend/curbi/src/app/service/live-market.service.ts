import { Injectable } from '@angular/core';

export interface BankSerie {
  id: number;
  monogram: string;
  logo: string;
  monogramClass: string;
  name: string;
  base: number;
  balance: number;
  change: number;
  points: number[];
}

export interface TxItem {
  when: string;
  title: string;
  detail: string;
  amount: number;
  icon: string;
}

/**
 * Simula un feed de mercado en vivo para las graficas del dashboard.
 * Cada tick la serie se desplaza con un random walk acotado, de modo que las
 * graficas genuinamente suben y bajan y el estado actual siempre refleja el ultimo valor.
 */
@Injectable({ providedIn: 'root' })
export class LiveMarketService {
  readonly tickMs = 3000;
  readonly pointsPerSerie = 24;

  readonly banks: BankSerie[] = [
    {
      id: 1,
      monogram: 'BI',
      logo: 'assets/images/bank-bi.png',
      monogramClass: 'bi',
      name: 'Banco Industrial (BI)',
      base: 185.2,
      balance: 185.2,
      change: 12.8,
      points: this.seed(185.2, 12.8),
    },
    {
      id: 2,
      monogram: 'BR',
      logo: 'assets/images/bank-banrural.png',
      monogramClass: 'br',
      name: 'Banco de Desarrollo Rural (Banrural)',
      base: 142.8,
      balance: 142.8,
      change: 5.8,
      points: this.seed(142.8, 5.8),
    },
    {
      id: 3,
      monogram: 'BC',
      logo: 'assets/images/bank-bancafe.png',
      monogramClass: 'bc',
      name: 'Banco del Café, S.A. (BANCAFE)',
      base: 64.15,
      balance: 64.15,
      change: -2.1,
      points: this.seed(64.15, -2.1),
    },
  ];

  /** Serie principal del dashboard (saldo total) */
  readonly totalPoints: number[] = [];
  totalBalance = 0;
  totalChange = 0;

  /** Gastos del mes recientes (simula la grafica de gastos) */
  readonly spendPoints: number[] = [];
  spendNow = 124.59;
  spendChange = 0;

  private readonly listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private started = false;

  constructor() {
    this.totalPoints = this.seed(392.15, 6.4);
    this.totalBalance = this.totalPoints[this.totalPoints.length - 1];
    this.totalChange = 6.4;
    this.spendPoints = this.seed(124.59, -3.2);
    this.spendNow = this.spendPoints[this.spendPoints.length - 1];
  }

  private seed(endValue: number, changePct: number): number[] {
    const start = endValue / (1 + changePct / 100);
    const n = this.pointsPerSerie;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const trend = start + (endValue - start) * t;
      const wobble = Math.sin(i * 1.7) * endValue * 0.018 + Math.cos(i * 0.9) * endValue * 0.01;
      out.push(Number((trend + wobble).toFixed(2)));
    }
    out[n - 1] = Number(endValue.toFixed(2));
    return out;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    this.start();
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }
    this.started = true;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.started = false;
  }

  /** Un paso de la simulacion: mueve todas las series un poco. */
  tick(): void {
    this.tickCount++;

    for (const bank of this.banks) {
      const delta = this.step(bank.balance, bank.base);
      bank.balance = Number(delta.toFixed(2));
      bank.points.push(bank.balance);
      bank.points.shift();
      bank.change = Number(
        (((bank.balance - bank.base) / bank.base) * 100 + bank.change * 0.98).toFixed(1),
      );
    }

    const newTotal = this.banks.reduce((s, b) => s + b.balance, 0);
    this.totalPoints.push(Number(newTotal.toFixed(2)));
    this.totalPoints.shift();
    const first = this.totalPoints[0];
    this.totalBalance = Number(newTotal.toFixed(2));
    this.totalChange = Number((((newTotal - first) / first) * 100).toFixed(2));

    const spendDelta = (Math.random() - 0.45) * 6;
    this.spendNow = Number(Math.max(20, this.spendNow + spendDelta).toFixed(2));
    this.spendPoints.push(this.spendNow);
    this.spendPoints.shift();
    const s0 = this.spendPoints[0];
    this.spendChange = Number((((this.spendNow - s0) / s0) * 100).toFixed(2));

    for (const fn of this.listeners) {
      fn();
    }
  }

  private step(current: number, base: number): number {
    const drift = (base - current) * 0.06;
    const noise = (Math.random() - 0.5) * base * 0.035;
    return current + drift + noise;
  }

  get status(): 'up' | 'down' | 'flat' {
    if (this.totalChange > 0.15) {
      return 'up';
    }
    if (this.totalChange < -0.15) {
      return 'down';
    }
    return 'flat';
  }

  get lastTickLabel(): string {
    return `tick #${this.tickCount}`;
  }

  /** Convierte una serie en puntos SVG (viewBox 0 0 240 80). */
  toPoints(values: number[], width = 240, height = 80, pad = 6): string {
    if (values.length < 2) {
      return '';
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = width / (values.length - 1);
    return values
      .map((v, i) => {
        const x = i * stepX;
        const y = height - pad - ((v - min) / range) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  /** Area bajo la curva para el relleno degradado. */
  toArea(values: number[], width = 240, height = 80, pad = 6): string {
    const line = this.toPoints(values, width, height, pad);
    if (!line) {
      return '';
    }
    return `0,${height} ${line} ${width},${height}`;
  }

  formatMoney(value: number): { integer: string; decimals: string } {
    const fixed = Math.abs(value).toFixed(2);
    const [i, d] = fixed.split('.');
    return { integer: i, decimals: d };
  }
}
