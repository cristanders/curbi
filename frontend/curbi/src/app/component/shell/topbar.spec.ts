import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Topbar } from './topbar';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [provideRouter([])],
    }).compileComponents();

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

  it('should render four nav links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.app-nav-link').length).toBe(4);
  });

  it('should mark the active link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const active = compiled.querySelector('.app-nav-link.is-active');
    expect(active?.textContent).toContain('Dashboard');
  });
});
