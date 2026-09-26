import { Injectable, Inject, Optional, PLATFORM_ID, REQUEST, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from './api.service';

const STORAGE_KEY = 'curbi.session.v2';
const LEGACY_KEYS = ['curbi.session'];

const EMPTY_USER: User = {
  id_user: 0,
  name: '',
  username: '',
  email: '',
  phone: '',
};

interface SessionPayload {
  user: User;
  demo: boolean;
}

/**
 * Guarda la sesión en una cookie (legible por el SSR y el navegador) y en
 * localStorage. Así, al volver a entrar a la app, el servidor puede renderizar
 * el perfil con el usuario real y no una pantalla vacía.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly userState = signal<User>(EMPTY_USER);
  private readonly demoState = signal(false);

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    @Optional() @Inject(REQUEST) private readonly request?: Request | null,
  ) {
    this.removeLegacy();
    this.read();
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private removeLegacy(): void {
    if (this.isBrowser) {
      try {
        for (const key of LEGACY_KEYS) {
          localStorage.removeItem(key);
          document.cookie = `${key}=; path=/; max-age=0; samesite=Lax`;
        }
      } catch {
        /* ignore */
      }
    }
  }

  private read(): void {
    const raw = this.readCookie();
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as SessionPayload;
      if (parsed?.user?.id_user) {
        this.userState.set(parsed.user);
        this.demoState.set(!!parsed.demo);
      }
    } catch {
      /* cookie inválida: se queda en usuario vacío */
    }
  }

  private readCookie(): string | null {
    let source = '';
    if (this.isBrowser) {
      try {
        source = document.cookie ?? '';
      } catch {
        source = '';
      }
    } else {
      try {
        source = this.request?.headers?.get?.('cookie') ?? '';
      } catch {
        source = '';
      }
    }
    if (!source) {
      return null;
    }
    const prefix = `${STORAGE_KEY}=`;
    for (const part of source.split(';')) {
      const token = part.trim();
      if (token.startsWith(prefix)) {
        return token.slice(prefix.length);
      }
    }
    return null;
  }

  private write(): void {
    const payload = encodeURIComponent(
      JSON.stringify({ user: this.userState(), demo: this.demoState() }),
    );
    if (this.isBrowser) {
      try {
        document.cookie = `${STORAGE_KEY}=${payload}; path=/; samesite=Lax; max-age=31536000`;
        localStorage.setItem(STORAGE_KEY, payload);
      } catch {
        /* ignore */
      }
    }
  }

  get currentUser(): User {
    return this.userState();
  }

  get hasUser(): boolean {
    return Boolean(this.userState()?.id_user);
  }

  get avatar(): string {
    return this.userState()?.avatar || '';
  }

  setAvatar(avatar: string): void {
    this.userState.set({ ...this.userState(), avatar });
    this.write();
  }

  get idUser(): number {
    return this.userState()?.id_user || 0;
  }

  get initials(): string {
    const parts = String(this.userState()?.name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  get isDemo(): boolean {
    return this.demoState();
  }

  set(user: User, demo: boolean): void {
    this.userState.set(user);
    this.demoState.set(demo);
    this.write();
  }

  clear(): void {
    this.userState.set(EMPTY_USER);
    this.demoState.set(false);
    if (this.isBrowser) {
      try {
        document.cookie = `${STORAGE_KEY}=; path=/; max-age=0; samesite=Lax`;
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }
}