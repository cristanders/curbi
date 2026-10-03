import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Learn } from './learn';

describe('Learn Component', () => {
  let component: Learn;
  let fixture: ComponentFixture<Learn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Learn],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      LEARN: {
        TITLE: 'Aprende con CURBI',
        BADGE: 'EDUCACIÓN FINANCIERA',
      },
    });
    translate.use('es');

    fixture = TestBed.createComponent(Learn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create Learn component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the main title and educational badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain('Aprende con CURBI');
    expect(compiled.querySelector('.head-badge')?.textContent).toContain('EDUCACIÓN FINANCIERA');
  });

  it('should have initial tab set to lessons', () => {
    expect(component.activeTab()).toBe('lessons');
  });

  it('should switch tabs properly', () => {
    component.setTab('calculators');
    expect(component.activeTab()).toBe('calculators');

    component.setTab('glossary');
    expect(component.activeTab()).toBe('glossary');
  });

  it('should calculate bug expense correctly', () => {
    component.bugExpenseAmount.set(20);
    component.bugExpenseDays.set(5);
    expect(component.bugWeekly()).toBe(100);
    expect(component.bugYearly()).toBe(5200);
  });

  it('should calculate 50/30/20 rule properly', () => {
    component.salaryInput.set(10000);
    expect(component.ruleNeeds()).toBe(5000);
    expect(component.ruleWants()).toBe(3000);
    expect(component.ruleSavings()).toBe(2000);
  });

  it('should calculate emergency fund target properly', () => {
    component.emergencyMonthlyExpenses.set(4000);
    component.emergencyMonths.set(6);
    expect(component.emergencyTarget()).toBe(24000);
  });

  it('should toggle lesson completion and update progress', () => {
    const firstLesson = component.lessons[0].id;
    expect(component.isLessonCompleted(firstLesson)).toBe(false);

    component.toggleLessonComplete(firstLesson);
    expect(component.isLessonCompleted(firstLesson)).toBe(true);
    expect(component.completedCount()).toBe(1);

    component.toggleLessonComplete(firstLesson);
    expect(component.isLessonCompleted(firstLesson)).toBe(false);
    expect(component.completedCount()).toBe(0);
  });

  it('should filter glossary terms by search keyword', () => {
    component.glossarySearch.set('hormiga');
    const filtered = component.filteredTerms();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered[0].term).toContain('Gastos Hormiga');
  });
});
