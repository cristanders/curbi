import { Component, OnInit } from '@angular/core';
import { Topbar } from '../shell/topbar';
import { ApiService, SavingsGoal } from '../../service/api.service';
import { SessionService } from '../../service/session.service';
import { RefreshBusService } from '../../service/refresh-bus.service';

interface SaveGoal {
  id: number;
  name: string;
  current: number;
  target: number;
  icon: string;
}

@Component({
  imports: [Topbar],
  selector: 'app-saves',
  styleUrl: './saves.css',
  templateUrl: './saves.html',
})
export class Saves implements OnInit {
  readonly goalIcons: Record<string, string> = {
    plane: 'assets/icons/goal-plane.svg',
    lock: 'assets/icons/goal-lock.svg',
    screen: 'assets/icons/goal-screen.svg',
  };

  totalSaved = '0';
  cashback = '0';
  interest = '0';
  interestDecimals = '00';
  source: 'api' | 'demo' = 'demo';
  lastUpdate = 'just now';

  goals: SaveGoal[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
    private readonly bus: RefreshBusService,
  ) {}

  async ngOnInit(): Promise<void> {
    const { data, ok } = await this.api.savingsGoals(this.session.idUser);
    const list = data ?? [];
    this.source = ok ? 'api' : 'demo';

    const icons = [this.goalIcons['plane'], this.goalIcons['lock'], this.goalIcons['screen']];
    this.goals = list.map((g: SavingsGoal, i: number) => ({
      id: g.id_saving,
      name: String(g.goal_name ?? 'META DE AHORRO').toUpperCase(),
      current: Number(g.current_amount ?? 0),
      target: Number(g.target_amount ?? 0),
      icon: icons[i % icons.length],
    }));

    this.applyTotals();
  }

  private applyTotals(): void {
    const saved = this.goals.reduce((s, g) => s + g.current, 0);
    const cashback = Math.round(saved * 0.0925);
    const interest = saved * 0.0622;

    this.totalSaved = this.group(saved).int;
    this.cashback = this.group(cashback).int;
    const i = this.group(interest);
    this.interest = i.int;
    this.interestDecimals = i.dec;
  }

  private group(value: number): { int: string; dec: string } {
    const [int, dec] = Math.max(0, value).toFixed(2).split('.');
    return { int: Number(int).toLocaleString('en-US'), dec };
  }

  progressOf(goal: SaveGoal): number {
    if (!goal.target) {
      return 0;
    }
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  }

  fmt(n: number): string {
    return n.toLocaleString('en-US');
  }

  viewDetails(goal: SaveGoal): void {
    console.log('details', goal);
  }

  async contribute(goal: SaveGoal): Promise<void> {
    const amount = 100;
    goal.current = Math.min(goal.target, goal.current + amount);
    this.applyTotals();
    await this.api.createSavingsGoal({
      goal_name: goal.name,
      target_amount: goal.target,
      current_amount: goal.current,
      id_user: this.session.idUser,
    });
    this.bus.emit();
  }
}
