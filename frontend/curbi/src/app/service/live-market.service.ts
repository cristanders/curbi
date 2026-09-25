import { Injectable } from '@angular/core';

export interface BankSerie {
  id: number;
  monogram: string;
  logo: string;
  monogramClass: string;
  name: string;
  color: string;
  base: number;
  balance: number;
  change: number;
  points: number[];
}

export interface WalletCardInput {
  bankId: string;
  name: string;
  monogram: string;
  logo: string;
  color: string;
  balance: number;
}

export interface TxItem {
  when: string;
  title: string;
  detail: string;
  amount: number;
  icon: string;
}

export interface SpendSource {
  amount: number;
  type_transacion?: 'Ingreso' | 'Gasto';
}

/**
 * Simula un feed de mercado en vivo para las graficas del dashboard.
 * - Las graficas de saldo/bancos se mueven constantemente (random walk acotado).
 * - La grafica "Recent spending" NO se mueve sola: solo avanza cuando llegan
 *   movimientos reales (gastos o ingresos) de la cuenta.
 */
@Injectable({ providedIn: 'root' })
export class LiveMarketService {
  readonly tickMs = 3000;
  readonly pointsPerSerie = 24;

  /** Sin datos reales no hay feed demo: las graficas parten de cero. */
  banks: BankSerie[] = [];

  /** Serie principal del dashboard (saldo total en vivo) */
  totalPoints: number[] = [];
  totalBalance = 0;
  totalChange = 0;

  /** Gastos del mes: se construye SOLO con movimientos reales de la cuenta. */
  readonly spendPoints: number[] = [];
  spendNow = 0;
  spendChange = 0;

  private readonly listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private started = false;

  constructor() {
    this.totalPoints = this.seed(0, 0);
    this.totalBalance = 0;
    this.totalChange = 0;
    this.spendPoints = this.seed(0, 0);
    this.spendNow = 0;
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

  /**
   * Un paso de la simulacion: mueve las graficas de saldo y bancos en vivo.
   * La grafica de gastos del mes NO participa aqui.
   */
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

    for (const fn of this.listeners) {
      fn();
    }
  }

  /**
   * Reemplaza las series demo por las tarjetas reales del usuario. Cada tarjeta
   * se convierte en una serie que parte del saldo real de la tarjeta. Si no hay
   * tarjetas, mantiene el feed demo original.
   */
  setBanksFromWallet(cards: WalletCardInput[]): void {
    if (!cards || cards.length === 0) {
      this.banks = [];
      this.totalPoints = this.seed(0, 0);
      this.totalBalance = 0;
      this.totalChange = 0;
      for (const fn of this.listeners) {
        fn();
      }
      return;
    }

    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);
    const series: BankSerie[] = cards.map((c, i) => ({
      id: i + 1,
      monogram: c.monogram,
      logo: c.logo,
      monogramClass: c.bankId,
      name: c.name,
      base: c.balance,
      balance: c.balance,
      change: 0,
      points: this.seed(c.balance, 0),
      color: c.color,
    }));

    this.banks = series;

    const total = Number(sum(series.map((b) => b.base)).toFixed(2));
    this.totalPoints = this.seed(total, 0);
    this.totalBalance = total;
    this.totalChange = 0;

    for (const fn of this.listeners) {
      fn();
    }
  }

  /**
   * Reconstruye la grafica "Recent spending" solo a partir de movimientos reales.
   * Si no hay movimientos la serie queda plana en cero (no se mueve sola).
   */
  syncSpend(txs: SpendSource[]): void {
    const n = this.pointsPerSerie;
    const out = new Array<number>(n).fill(0);
    let cum = 0;

    const list = txs.slice(0, n);
    if (list.length > 0) {
      const chunk = n / list.length;
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        cum += t.type_transacion === 'Ingreso' ? t.amount : -t.amount;
        const start = i === 0 ? 0 : Math.round(i * chunk);
        const end = Math.round((i + 1) * chunk);
        for (let j = start; j < Math.min(end, n); j++) {
          out[j] = Number(cum.toFixed(2));
        }
      }
    }

    for (let i = 0; i < n; i++) {
      this.spendPoints[i] = out[i];
    }
    const previous = this.spendNow;
    this.spendNow = Number(out[n - 1].toFixed(2));
    this.spendChange =
      previous !== 0 ? Number((((this.spendNow - previous) / previous) * 100).toFixed(2)) : 0;

    for (const fn of this.listeners) {
      fn();
    }
  }

  private step(current: number, base: number): number {
    const drift = (base - current) * 0.06;
    const amp = Math.max(base * 0.035, 3);
    const noise = (Math.random() - 0.5) * amp;
    return Math.max(0, current + drift + noise);
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