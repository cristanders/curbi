import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from '../../service/api.service';
import { Wallet } from './wallet';

describe('Wallet', () => {
  let component: Wallet;
  let fixture: ComponentFixture<Wallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wallet],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'createAccount').mockResolvedValue({ data: null, ok: false });

    fixture = TestBed.createComponent(Wallet);
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

  it('should render my wallets title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-head h1')?.textContent).toContain('My Wallets');
  });

  it('should start with an empty balance and no movements', () => {
    expect(component.movements.length).toBe(0);
    expect(component.balanceParts.integer).toBe('0');
    expect(component.balanceParts.decimals).toBe('00');
    expect(component.income).toBe('0.00');
    expect(component.expense).toBe('0.00');
  });

  it('should keep the holder name from the session', () => {
    expect(component.holder).toBe('');
  });
});