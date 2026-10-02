import { Injectable, Inject, Optional, PLATFORM_ID, REQUEST, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type SupportedLanguage = 'es' | 'en' | 'fr' | 'pt' | 'sd' | 'kaq';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nameInLang: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', nameInLang: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'Inglés (English)', nameInLang: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Francés (Français)', nameInLang: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Portugués (Português)', nameInLang: 'Português', flag: '🇧🇷' },
  { code: 'sd', label: 'Sindhi (سنڌي)', nameInLang: 'سنڌي', flag: '🇵🇰' },
  { code: 'kaq', label: 'Kaqchikel', nameInLang: 'Kaqchikel', flag: '🇬🇹' },
];

const DEFAULT_LANG: SupportedLanguage = 'es';
const COOKIE_NAME = 'lang';
const STORAGE_KEY = 'curbi.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly supportedLanguages = SUPPORTED_LANGUAGES;
  readonly currentLanguage = signal<SupportedLanguage>(DEFAULT_LANG);

  constructor(
    private readonly translate: TranslateService,
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    @Optional() @Inject(REQUEST) private readonly request?: Request | null,
  ) {
    this.init();
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  init(): void {
    this.translate.addLangs(['es', 'en', 'fr', 'pt', 'sd', 'kaq']);
    this.translate.setFallbackLang(DEFAULT_LANG);

    const initialLang = this.detectInitialLanguage();
    this.currentLanguage.set(initialLang);
    this.translate.use(initialLang);
    this.applyTextDirection(initialLang);
  }

  private applyTextDirection(lang: SupportedLanguage): void {
    if (!this.isBrowser) {
      return;
    }
    const isRtl = lang === 'sd';
    const dir = isRtl ? 'rtl' : 'ltr';
    try {
      document.body.setAttribute('dir', dir);
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    } catch {
      /* ignore */
    }
  }

  private detectInitialLanguage(): SupportedLanguage {
    // 1. Leer cookie 'lang'
    const cookieLang = this.readCookie(COOKIE_NAME);
    if (this.isValidLang(cookieLang)) {
      return cookieLang.toLowerCase() as SupportedLanguage;
    }

    // 2. Leer localStorage
    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (this.isValidLang(stored)) {
          return stored.toLowerCase() as SupportedLanguage;
        }
      } catch {
        /* ignore */
      }

      // 3. Preferencia del navegador
      try {
        const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
        if (this.isValidLang(browserLang)) {
          return browserLang as SupportedLanguage;
        }
      } catch {
        /* ignore */
      }
    }

    return DEFAULT_LANG;
  }

  private isValidLang(lang: unknown): lang is SupportedLanguage {
    return (
      typeof lang === 'string' &&
      ['es', 'en', 'fr', 'pt', 'sd', 'kaq'].includes(lang.toLowerCase())
    );
  }

  private readCookie(name: string): string | null {
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
    const prefix = `${name}=`;
    for (const part of source.split(';')) {
      const token = part.trim();
      if (token.startsWith(prefix)) {
        return token.slice(prefix.length);
      }
    }
    return null;
  }

  private writeCookie(name: string, value: string, days = 30): void {
    if (this.isBrowser) {
      try {
        const maxAge = days * 24 * 60 * 60;
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=Lax`;
      } catch {
        /* ignore */
      }
    }
  }

  async changeLanguage(lang: SupportedLanguage | string): Promise<void> {
    const validLang: SupportedLanguage = this.isValidLang(lang)
      ? (lang.toLowerCase() as SupportedLanguage)
      : DEFAULT_LANG;

    this.currentLanguage.set(validLang);
    this.translate.use(validLang);
    this.applyTextDirection(validLang);

    if (this.isBrowser) {
      this.writeCookie(COOKIE_NAME, validLang);
      try {
        localStorage.setItem(STORAGE_KEY, validLang);
      } catch {
        /* ignore */
      }
    }

    // Sincronizar con el backend Express con credenciales
    try {
      await firstValueFrom(
        this.http.post(
          '/api/set-language',
          { lang: validLang },
          { withCredentials: true }
        )
      );
    } catch (err) {
      // El frontend no se bloquea si el backend está desconectado o en modo demo
      console.warn('LanguageService: no se pudo sincronizar el idioma con el backend:', err);
    }
  }

  get currentLang(): SupportedLanguage {
    return this.currentLanguage();
  }
}
