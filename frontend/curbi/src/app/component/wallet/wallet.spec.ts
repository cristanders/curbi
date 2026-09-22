import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from '../../service/api.service';
import { DemoDataService } from '../../service/demo-data.service';
import { Wallet } from './wallet';

describe('Wallet', () => {
  let component: Wallet;
  let fixture: ComponentFixture<Wallet>;
  let demo: DemoDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wallet],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    demo = TestBed.inject(DemoDataService);
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

  it('should render the demo movements', () => {
    expect(component.movements.length).toBeGreaterThan(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.movement').length).toBeGreaterThan(0);
  });

  it('should fall back to demo accounts', () => {
    expect(component.source).toBe('demo');
    expect(component.accounts.length).toBe(demo.accounts.length);
  });
});
