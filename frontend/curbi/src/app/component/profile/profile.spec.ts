import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Profile } from './profile';
import { ApiService } from '../../service/api.service';
import { SessionService } from '../../service/session.service';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'dashboard').mockResolvedValue({ data: null, ok: false });

    const session = TestBed.inject(SessionService);
    session.set(
      {
        id_user: 5,
        name: 'Juan Pérez',
        username: 'juanperez',
        email: 'juan@mail.com',
        phone: '+502 0000-0000',
      },
      false,
    );

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the session user full name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.full-name')?.textContent).toContain('Juan Pé');
    expect(compiled.querySelector('.handle')?.textContent).toContain('@juanperez');
  });

  it('should start with zero balances', () => {
    expect(component.accountBalance).toBe('0');
    expect(component.accountDecimals).toBe('00');
    expect(component.savings).toBe('0');
    expect(component.totalSpent).toBe('0.00');
    expect(component.activeWallets).toBe('0');
    expect(component.savingsProgress).toBe(0);
  });

  it('should toggle edit mode', async () => {
    component.toggleEdit();
    await fixture.whenStable();
    expect(component.editMode).toBe(true);
  });
});