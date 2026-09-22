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

  it('should render demo rows', () => {
    expect(component.rows.length).toBeGreaterThan(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.tx-row').length).toBeGreaterThan(0);
  });
});
