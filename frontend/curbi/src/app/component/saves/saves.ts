import { Component, OnInit } from '@angular/core';
import { Topbar } from '../shell/topbar';
import { ApiService, SavingsGoal } from '../../service/api.service';
import { DemoDataService } from '../../service/demo-data.service';
import { SessionService } from '../../service/session.service';

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
    plane: 'assets/icons/goal-plane.png',
    lock: 'assets/icons/goal-lock.png',
    screen: 'assets/icons/goal-screen.png',
  };

  totalSaved = '200';
  cashback = '185';
  interest = '12';
  interestDecimals = '45';
  source: 'api' | 'demo' = 'demo';
  lastUpdate = 'just now';

  goals: SaveGoal[] = [
    { id: 1, name: 'VIAJE A LA ANTIGUA', current: 3000, target: 4000, icon: this.goalIcons['plane'] },
    {
      id: 2,
      name: 'FONDOS DE EMERGENCIA',
      current: 8500,
      target: 8500,
      icon: this.goalIcons['lock'],
    },
    { id: 3, name: 'NINTENDO SWITCH 2', current: 1500, target: 6500, icon: this.goalIcons['screen'] },
  ];

  constructor(
    private readonly api: ApiService,
    private readonly demo: DemoDataService,
    private readonly session: SessionService,
  ) {}

  async ngOnInit(): Promise<void> {
    const { data, ok } = await this.api.savingsGoals(this.session.idUser);
    const list = ok && data.length ? data : this.demo.savingsGoals;
    this.source = ok && data.length ? 'api' : 'demo';

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
    const saved = this.goals.reduce((s, g) => s + g.current, 0) || 200;
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
  }
}
