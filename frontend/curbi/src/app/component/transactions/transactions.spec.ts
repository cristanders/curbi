import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from '../../service/api.service';
import { Transactions } from './transactions';

describe('Transactions', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'categories').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'createTransaction').mockResolvedValue({ data: null, ok: false });

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
    await component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-head h1')?.textContent).toContain('Transactions');
  });

  it('should render three stat cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.stat-card').length).toBe(3);
  });

  it('should render zero totals and no rows when there is no data', () => {
    expect(component.rows.length).toBe(0);
    expect(component.incomeTotal).toBe('0.00');
    expect(component.expenseTotal).toBe('0.00');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.tx-row').length).toBe(0);
  });
});
