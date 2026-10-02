import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Profile } from './profile';
import { ApiBusinessError, ApiService, House } from '../../service/api.service';
import { SessionService } from '../../service/session.service';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      PROFILE: {
        MESSAGES: {
          SAVE_SUCCESS: 'Cambios guardados',
          SAVE_ERROR: 'No se pudieron guardar los cambios',
          FAMILY_NAME_REQUIRED: 'Ponle un nombre a la familia',
          USERNAME_REQUIRED: 'Escribe un username',
          FAMILY_CREATE_ERROR: 'No se pudo crear el grupo',
          SEARCH_ERROR: 'No se pudo buscar',
          JOIN_ERROR: 'No se pudo unir al grupo',
        },
        FAMILY: {
          ROLE_MEMBER: 'Member',
        },
      },
    });
    translate.use('es');

    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'dashboard').mockResolvedValue({ data: null, ok: false });
    vi.spyOn(api, 'houses').mockResolvedValue({ data: [], ok: true });

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
    expect(component.accountBalance()).toBe('0');
    expect(component.accountDecimals()).toBe('00');
    expect(component.savings()).toBe('0');
    expect(component.totalSpent()).toBe('0.00');
    expect(component.activeWallets()).toBe('0');
    expect(component.savingsProgress()).toBe(0);
  });

  it('should toggle edit mode', async () => {
    component.toggleEdit();
    await fixture.whenStable();
    expect(component.editMode).toBe(true);
  });

  describe('guardar perfil', () => {
    it('debe llamar a la API, cerrar edicion y actualizar la sesion', async () => {
      const api = TestBed.inject(ApiService);
      const update = vi.spyOn(api, 'updateProfile').mockResolvedValue({
        data: {
          id_user: 5,
          name: 'Juan Carlos Pérez',
          username: 'juanperez',
          email: 'nuevo@mail.com',
          phone: '5555',
          location: 'Zona 10',
        },
        ok: true,
      });

      component.toggleEdit(); // abrir
      component.draft = {
        fullName: 'Juan Carlos Pérez',
        email: 'nuevo@mail.com',
        phone: '5555',
        location: 'Zona 10',
      };
      await component.toggleEdit(); // guardar

      expect(update).toHaveBeenCalledWith(5, {
        name: 'Juan Carlos Pérez',
        email: 'nuevo@mail.com',
        phone: '5555',
        location: 'Zona 10',
      });
      expect(component.editMode).toBe(false);
      expect(component.savedMessage).toBe('Cambios guardados');

      // La sesion es la que pinta el topbar: si no se actualiza, el resto de la
      // app sigue mostrando el nombre anterior.
      const session = TestBed.inject(SessionService);
      expect(session.currentUser.name).toBe('Juan Carlos Pérez');
      expect(session.currentUser.email).toBe('nuevo@mail.com');
    });

    it('debe quedarse en edicion y mostrar el motivo si la API rechaza', async () => {
      const api = TestBed.inject(ApiService);
      vi.spyOn(api, 'updateProfile').mockResolvedValue({
        data: null,
        ok: false,
        error: new ApiBusinessError('PERFIL_INVALIDO', 'Ese correo ya esta en uso'),
      });

      component.toggleEdit(); // abrir
      component.draft.email = 'ana@curbi.test';
      await component.toggleEdit(); // guardar

      expect(component.editMode).toBe(true);
      expect(component.savedMessage).toBe('Ese correo ya esta en uso');
      // No debe haber tocado la sesion.
      expect(TestBed.inject(SessionService).currentUser.email).toBe('juan@mail.com');
    });

    it('no debe enviar dos veces si se pulsa dos veces seguido', async () => {
      const api = TestBed.inject(ApiService);
      const update = vi
        .spyOn(api, 'updateProfile')
        .mockResolvedValue({ data: null, ok: false, error: undefined });

      component.toggleEdit(); // abrir
      const primero = component.toggleEdit(); // guardar
      const segundo = component.toggleEdit(); // otro click seguido
      await Promise.all([primero, segundo]);
      await fixture.whenStable();

      expect(update).toHaveBeenCalledTimes(1);
    });
  });

  describe('panel de familia', () => {
    const grupo = (over: Partial<House> = {}): House => ({
      id_house: 1,
      name: 'Casa Ruiz',
      username: 'juanperez',
      members: [{ id_member: 1, id_house: 1, id_user: 5, username: 'juanperez', role: 'Admin' }],
      role: 'Admin',
      member_count: 1,
      is_member: true,
      ...over,
    });

    it('empieza cerrado y el boton lo abre', async () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(component.familyOpen()).toBe(false);
      expect(compiled.querySelector('.family')).toBeNull();

      await component.toggleFamily();
      fixture.detectChanges();

      expect(component.familyOpen()).toBe(true);
      expect(compiled.querySelector('.family')).not.toBeNull();
    });

    it('carga mis grupos al abrir', async () => {
      const api = TestBed.inject(ApiService);
      const houses = vi.spyOn(api, 'houses').mockResolvedValue({ data: [grupo()], ok: true });

      await component.toggleFamily();

      expect(houses).toHaveBeenCalledWith('juanperez', 5);
      expect(component.houses().length).toBe(1);
      expect(component.houses()[0].name).toBe('Casa Ruiz');
    });

    it('rechaza crear un grupo sin nombre sin llamar al backend', async () => {
      const api = TestBed.inject(ApiService);
      const crear = vi.spyOn(api, 'createHouse');

      component.familyName = '   ';
      await component.createHouse();

      expect(crear).not.toHaveBeenCalled();
      expect(component.familyError()).toBe('Ponle un nombre a la familia');
    });

    it('crea el grupo con el username de la sesion y recarga la lista', async () => {
      const api = TestBed.inject(ApiService);
      const crear = vi.spyOn(api, 'createHouse').mockResolvedValue({ data: grupo(), ok: true });

      component.familyName = '  Casa Ruiz  ';
      await component.createHouse();

      expect(crear).toHaveBeenCalledWith('Casa Ruiz', 'juanperez', 5);
      expect(component.familyName).toBe('');
      expect(component.familyError()).toBe('');
    });

    it('muestra el motivo si el backend no crea el grupo', async () => {
      const api = TestBed.inject(ApiService);
      vi.spyOn(api, 'createHouse').mockResolvedValue({
        data: null,
        ok: false,
        error: new ApiBusinessError('CASA_INVALIDA', 'El nombre es demasiado largo'),
      });

      component.familyName = 'x'.repeat(80);
      await component.createHouse();

      expect(component.familyError()).toBe('El nombre es demasiado largo');
      expect(component.familyName).toBe('x'.repeat(80));
    });

    it('solo ofrece los grupos ajenos de los que no soy miembro', async () => {
      const api = TestBed.inject(ApiService);
      vi.spyOn(api, 'houses').mockResolvedValue({
        data: [grupo(), grupo({ id_house: 2, name: 'Otro', is_member: false, role: null })],
        ok: true,
      });

      component.familySearch = '@ana';
      await component.searchHouses();

      // Busca sin el @ inicial, que es como lo escribe la gente.
      expect(component.joinable().length).toBe(1);
      expect(component.joinable()[0].id_house).toBe(2);
    });

    it('exige un username antes de buscar', async () => {
      const api = TestBed.inject(ApiService);
      const houses = vi.spyOn(api, 'houses');

      component.familySearch = '  ';
      await component.searchHouses();

      expect(houses).not.toHaveBeenCalled();
      expect(component.familyError()).toBe('Escribe un username');
    });

    it('se une al grupo y limpia la busqueda', async () => {
      const api = TestBed.inject(ApiService);
      const unirse = vi.spyOn(api, 'joinHouse').mockResolvedValue({ data: grupo(), ok: true });

      component.familySearch = 'ana';
      await component.joinHouse(grupo({ id_house: 2 }));

      expect(unirse).toHaveBeenCalledWith(2, 'juanperez', 5);
      expect(component.familySearch).toBe('');
      expect(component.joinable().length).toBe(0);
    });

    it('avisa cuando ya se es miembro en vez de fallar en silencio', async () => {
      const api = TestBed.inject(ApiService);
      vi.spyOn(api, 'joinHouse').mockResolvedValue({
        data: null,
        ok: false,
        error: new ApiBusinessError('YA_ES_MIEMBRO', 'Ya eres parte de este grupo'),
      });

      await component.joinHouse(grupo({ id_house: 2 }));

      expect(component.familyError()).toBe('Ya eres parte de este grupo');
    });
  });
});