import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { LanguageService, SUPPORTED_LANGUAGES } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'lang=; max-age=0; path=/';
    document.body.removeAttribute('dir');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
        LanguageService,
      ],
    });

    service = TestBed.inject(LanguageService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    document.body.removeAttribute('dir');
    localStorage.clear();
  });

  it('should support all 6 languages', () => {
    expect(SUPPORTED_LANGUAGES.length).toBe(6);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(['es', 'en', 'fr', 'pt', 'sd', 'kaq']);
  });

  it('should initialize with ltr text direction for Latin languages', () => {
    expect(['es', 'en']).toContain(service.currentLang);
    expect(document.body.getAttribute('dir')).toBe('ltr');
  });

  it('should detect Spanish from cookie when lang=es is present', () => {
    document.cookie = 'lang=es; path=/';
    service.init();
    expect(service.currentLang).toBe('es');
    expect(document.body.getAttribute('dir')).toBe('ltr');
  });

  it('should set rtl text direction on body when Sindhi (sd) is selected', async () => {
    const promise = service.changeLanguage('sd');
    const req = httpTesting.expectOne('/api/set-language');
    expect(req.request.body).toEqual({ lang: 'sd' });
    req.flush({ success: true, lang: 'sd' });
    await promise;

    expect(service.currentLang).toBe('sd');
    expect(document.body.getAttribute('dir')).toBe('rtl');
    expect(localStorage.getItem('curbi.lang')).toBe('sd');
  });

  it('should restore ltr text direction when switching from sd to another language', async () => {
    const p1 = service.changeLanguage('sd');
    httpTesting.expectOne('/api/set-language').flush({ success: true });
    await p1;
    expect(document.body.getAttribute('dir')).toBe('rtl');

    const p2 = service.changeLanguage('fr');
    httpTesting.expectOne('/api/set-language').flush({ success: true });
    await p2;

    expect(service.currentLang).toBe('fr');
    expect(document.body.getAttribute('dir')).toBe('ltr');
    expect(localStorage.getItem('curbi.lang')).toBe('fr');
  });

  it('should persist language in cookie and localStorage', async () => {
    const p = service.changeLanguage('pt');
    httpTesting.expectOne('/api/set-language').flush({ success: true });
    await p;

    expect(localStorage.getItem('curbi.lang')).toBe('pt');
    expect(document.cookie).toContain('lang=pt');
  });
});
