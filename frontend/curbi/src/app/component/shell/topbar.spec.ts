import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Topbar } from './topbar';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      TOPBAR: {
        HOME: 'Dashboard',
        WALLET: 'Billetera',
        SAVES: 'Ahorros',
        TRANSACTIONS: 'Transacciones',
        LEARN: 'Aprende',
        NOTIFICATIONS: 'Notificaciones',
        PROFILE: 'Perfil',
        SELECT_LANGUAGE: 'Seleccionar idioma',
      },
    });
    translate.use('es');

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    component.active = 'home';
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the brand name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-brand-name')?.textContent).toContain('CURBI');
  });

  it('should render nav links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.app-nav-link').length).toBe(5);
  });

  it('should mark the active link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const active = compiled.querySelector('.app-nav-link.is-active');
    expect(active?.textContent).toContain('Dashboard');
  });

  it('should render the language selector with 6 supported languages', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('.topbar-lang-select');
    expect(select).toBeTruthy();
    expect(select?.querySelectorAll('option').length).toBe(6);
  });
});
