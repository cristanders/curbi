import { Injectable } from '@angular/core';
import { User } from './api.service';

const STORAGE_KEY = 'curbi.session';

const DEMO_USER: User = {
  id_user: 1,
  name: 'BRAYAN CAMPA',
  username: 'brayancampa',
  email: 'brayan.compa@curbi.com',
  phone: '+502 5555-1234',
};

@Injectable({ providedIn: 'root' })
export class SessionService {
  private user: User = DEMO_USER;
  private demo = true;

  constructor() {
    this.read();
  }

  private read(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) {
          this.user = parsed.user;
          this.demo = !!parsed.demo;
        }
      }
    } catch {
      /* sin storage: se queda en demo */
    }
  }

  private write(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, demo: this.demo }));
    } catch {
      /* ignore */
    }
  }

  get currentUser(): User {
    return this.user;
  }

  get idUser(): number {
    return Number(this.user?.id_user) || 1;
  }

  get initials(): string {
    const parts = String(this.user?.name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) {
      return 'BC';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  get isDemo(): boolean {
    return this.demo;
  }

  set(user: User, demo: boolean): void {
    this.user = user;
    this.demo = demo;
    this.write();
  }

  clear(): void {
    this.user = DEMO_USER;
    this.demo = true;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }
}
