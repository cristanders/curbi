import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService, AppNotification } from './api.service';
import { SessionService } from './session.service';

/** Cada cuánto se consulta si hay novedades. */
const POLL_MS = 10000;

/**
 * Notificaciones del usuario (depositos recibidos, cupos aprobados, pagos).
 * El backend expone el listado junto con el numero de pendientes, asi que un
 * solo endpoint alimenta la lista y el badge.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly itemsState = signal<AppNotification[]>([]);
  private readonly unreadState = signal(0);
  private readonly loadingState = signal(false);
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  /** Cuantas vistas pidiendo el sondeo. Evita que una destruya el timer de otra. */
  private consumers = 0;

  readonly notifications = this.itemsState.asReadonly();
  readonly unread = this.unreadState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly hasUnread = computed(() => this.unreadState() > 0);

  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
  ) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async refresh(): Promise<void> {
    if (!this.isBrowser || this.loadingState()) {
      return;
    }
    this.loadingState.set(true);
    try {
      const { data } = await this.api.notifications(this.session.idUser);
      if (data) {
        this.itemsState.set(data.notifications ?? []);
        this.unreadState.set(data.unread ?? 0);
      }
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Registra una vista que necesita novedades. El sondeo arranca con la primera
   * y se detiene cuando ya no queda ninguna, sin depender de quien llame.
   */
  attach(): void {
    if (!this.isBrowser) {
      return;
    }
    this.consumers += 1;
    void this.refresh();
    if (this.pollTimer === null) {
      this.pollTimer = setInterval(() => void this.refresh(), POLL_MS);
    }
  }

  /** Libera el registro de la vista. */
  detach(): void {
    this.consumers = Math.max(0, this.consumers - 1);
    if (this.consumers === 0 && this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async markAllRead(): Promise<void> {
    const idUser = this.session.idUser;
    if (this.unreadState() === 0) {
      return;
    }
    // Optimista: la lista se marca leida de inmediato y se reconcilia al vuelo.
    this.itemsState.update((items) => items.map((n) => ({ ...n, is_read: true })));
    this.unreadState.set(0);
    const { ok } = await this.api.markNotificationsRead(idUser);
    if (!ok) {
      await this.refresh();
    }
  }

  /** Texto relativo para la marca de tiempo. */
  timeAgo(createdAt: string): string {
    const then = new Date(createdAt).getTime();
    if (Number.isNaN(then)) {
      return '';
    }
    const minutos = Math.floor((Date.now() - then) / 60000);
    if (minutos < 1) {
      return 'ahora';
    }
    if (minutos < 60) {
      return `hace ${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    if (horas < 24) {
      return `hace ${horas} h`;
    }
    return new Date(then).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
  }
}
