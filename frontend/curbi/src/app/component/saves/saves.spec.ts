import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Saves } from './saves';

describe('Saves', () => {
  let component: Saves;
  let fixture: ComponentFixture<Saves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Saves],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Saves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render my saves title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain('My saves');
  });

  it('should render three stat cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.stat-card').length).toBe(3);
  });

  it('should start with no goals and zero totals', () => {
    expect(component.goals.length).toBe(0);
    expect(component.totalSaved).toBe('0');
    expect(component.cashback).toBe('0');
    expect(component.interest).toBe('0');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.goal-card').length).toBe(0);
  });

  it('should compute 0% progress for a goal without target', () => {
    const goal = { id: 1, name: 'META', current: 0, target: 0, icon: '' };
    expect(component.progressOf(goal)).toBe(0);
  });

  it('should compute progress for a goal with target', () => {
    const goal = { id: 1, name: 'META', current: 3000, target: 4000, icon: '' };
    expect(component.progressOf(goal)).toBe(75);
  });
});
