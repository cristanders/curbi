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

  it('should render three goals', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.goal-card').length).toBe(3);
  });

  it('should compute 40% for first goal', () => {
    expect(component.progressOf(component.goals[0])).toBe(75);
  });

  it('should compute 100% for completed goal', () => {
    expect(component.progressOf(component.goals[1])).toBe(100);
  });
});
