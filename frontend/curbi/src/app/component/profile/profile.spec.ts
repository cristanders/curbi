import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the full name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.full-name')?.textContent).toContain(
      'Brayan Oswaldo Compa Fuentes',
    );
  });

  it('should toggle edit mode', async () => {
    component.toggleEdit();
    await fixture.whenStable();
    expect(component.editMode).toBe(true);
  });
});
