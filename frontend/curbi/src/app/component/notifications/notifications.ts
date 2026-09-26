import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Topbar, TopbarActive } from '../shell/topbar';
import { AppNotification } from '../../service/api.service';
import { NotificationService } from '../../service/notification.service';
import { SessionService } from '../../service/session.service';

type Filter = 'todas' | 'no-leidas';

interface Row {
  id: number;
  type: AppNotification['type'];
  title: string;
  message: string;
  amount?: number;
  read: boolean;
  when: string;
  glyph: string;
  color: string;
}

/** Icono y color por tipo, para no repetir el switch en el template. */
const LOOK: Record<AppNotification['type'], { glyph: string; color: string }> = {
  Deposito: { glyph: '↓', color: '#16a34a' },
  Transferencia: { glyph: '↑', color: '#1f7a80' },
  Credito: { glyph: '%', color: '#7c3aed' },
  Factura: { glyph: '✓', color: '#ea580c' },
  Sistema: { glyph: 'i', color: '#64748b' },
};

@Component({
  imports: [Topbar],
  selector: 'app-notifications',
  styleUrl: './notifications.css',
  templateUrl: './notifications.html',
})
export class Notifications implements OnInit, OnDestroy {
  readonly active: TopbarActive = 'none';
  readonly filter = signal<Filter>('todas');

  private readonly store = inject(NotificationService);
  private readonly session = inject(SessionService);

  /** El listado se deriva del store, asi que el sondeo lo refleja solo. */
  private readonly all = computed<Row[]>(() =>
    this.store.notifications().map((n) => {
      const look = LOOK[n.type] ?? LOOK.Sistema;
      return {
        id: n.id_notification,
        type: n.type,
        title: n.title,
        message: n.message,
        amount: n.amount === null || n.amount === undefined ? undefined : Number(n.amount),
        read: Boolean(n.is_read),
        when: this.store.timeAgo(n.created_at),
        glyph: look.glyph,
        color: look.color,
      };
    }),
  );

  readonly rows = computed(() =>
    this.filter() === 'no-leidas' ? this.all().filter((r) => !r.read) : this.all(),
  );

  readonly unread = computed(() => this.all().filter((r) => !r.read).length);
  readonly loading = this.store.loading;

  async ngOnInit(): Promise<void> {
    this.store.attach();
  }

  ngOnDestroy(): void {
    this.store.detach();
  }

  get user(): string {
    return this.session.currentUser.name || '';
  }

  setFilter(value: Filter): void {
    this.filter.set(value);
  }

  async markAllRead(): Promise<void> {
    await this.store.markAllRead();
  }

  async refresh(): Promise<void> {
    await this.store.refresh();
  }

  money(value: number): string {
    return `Q${value.toFixed(2)}`;
  }
}
