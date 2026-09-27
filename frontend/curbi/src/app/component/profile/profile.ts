import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Topbar } from '../shell/topbar';
import { ApiService, House } from '../../service/api.service';
import { SessionService } from '../../service/session.service';

@Component({
  imports: [FormsModule, NgIf, Topbar],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  readonly defaultAvatarUrl = 'assets/images/avatar.png';
  readonly verifiedUrl = 'assets/icons/verified.png';
  readonly savingsIconUrl = 'assets/icons/savings-pig.png';

  /**
   * Todo lo que se carga despues de un await vive en signals: la app es
   * zoneless, asi que escribir una propiedad normal no repintaba la vista y la
   * pantalla se quedaba en 0 hasta que el usuario tocaba algun boton.
   */
  readonly avatarUrl = computed(() => this.session.avatar || this.defaultAvatarUrl);

  readonly fullName = signal('');
  readonly username = signal('');
  readonly rank = signal('Member');
  readonly email = signal('');
  readonly phone = signal('');
  readonly memberSince = signal('');
  readonly location = signal('');
  readonly savings = signal('0');
  readonly savingsDecimals = signal('00');
  readonly savingsRange = signal('6 Months');
  readonly savingsGoal = signal('Q0.00');
  readonly savingsProgress = signal(0);
  readonly accountBalance = signal('0');
  readonly accountDecimals = signal('00');
  readonly totalSpent = signal('0.00');
  readonly activeWallets = signal('0');
  readonly source = signal<'api' | 'demo'>('demo');

  editMode = false;
  notifications = true;
  biometricLogin = false;
  savedMessage = '';
  /** true mientras se guardan los cambios: deshabilita el boton y evita doble envio. */
  saving = false;

  /* ----- familia: grupos a los que pertenezco y a los que puedo unirme ----- */
  readonly houses = signal<House[]>([]);
  readonly familyOpen = signal(false);
  readonly familyBusy = signal(false);
  /** Grupos de otra persona, resultado de buscar por username. */
  readonly joinable = signal<House[]>([]);
  readonly familyError = signal('');
  familyName = '';
  familySearch = '';

  draft = {
    fullName: '',
    email: '',
    phone: '',
    location: '',
  };

  private readonly api = inject(ApiService);
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    const { data } = await this.api.dashboard(this.session.idUser);
    this.source.set(data ? 'api' : 'demo');

    const u = this.session.currentUser;
    this.applyUser({
      name: u.name,
      email: u.email,
      phone: u.phone,
      location: u.location,
    });
    this.username.set(u.username ? `@${u.username}` : '');

    const s = data?.summary;
    if (!s) {
      return;
    }
    const f = (v: number) => Math.abs(v).toFixed(2).split('.');
    const bal = f(s.totalBalance);
    this.accountBalance.set(bal[0]);
    this.accountDecimals.set(bal[1]);

    const sav = f(s.totalSaved);
    this.savings.set(sav[0]);
    this.savingsDecimals.set(sav[1]);

    this.totalSpent.set(s.expense.toFixed(2));
    this.activeWallets.set(String(s.accountCount));

    const goal = data?.savingsGoals?.[0];
    if (goal) {
      const target = Number(goal.target_amount) || 1;
      const current = Number(goal.current_amount) || 0;
      this.savingsGoal.set(`Q${Number(goal.target_amount ?? 0).toFixed(2)}`);
      this.savingsProgress.set(Math.min(100, Math.round((current / target) * 100)));
    }

    await this.loadHouses();
  }

  /** Mis grupos: los que cree y a los que me uni. */
  private async loadHouses(): Promise<void> {
    const u = this.session.currentUser;
    if (!u?.username) {
      return;
    }
    const { data } = await this.api.houses(u.username, this.session.idUser);
    this.houses.set(data ?? []);
  }

  async toggleFamily(): Promise<void> {
    const abierto = !this.familyOpen();
    this.familyOpen.set(abierto);
    this.familyError.set('');
    if (abierto) {
      await this.loadHouses();
    }
  }

  async createHouse(): Promise<void> {
    const nombre = this.familyName.trim();
    const u = this.session.currentUser;
    if (!nombre) {
      this.familyError.set('Ponle un nombre a la familia');
      return;
    }
    if (this.familyBusy()) {
      return;
    }
    this.familyBusy.set(true);
    this.familyError.set('');
    const { ok, error } = await this.api.createHouse(nombre, u.username, this.session.idUser);
    this.familyBusy.set(false);
    if (!ok) {
      this.familyError.set(error?.message ?? 'No se pudo crear el grupo');
      return;
    }
    this.familyName = '';
    await this.loadHouses();
  }

  /**
   * Busca los grupos de otra persona. Solo se muestran los que el usuario todavia
   * no es parte: ofrecer "unirme" a un grupo del que ya forma parte produce un
   * error en vez de algo util.
   */
  async searchHouses(): Promise<void> {
    const username = this.familySearch.trim().replace(/^@/, '');
    if (!username) {
      this.familyError.set('Escribe un username');
      return;
    }
    if (this.familyBusy()) {
      return;
    }
    this.familyBusy.set(true);
    this.familyError.set('');
    const { data, ok, error } = await this.api.houses(username, this.session.idUser);
    this.familyBusy.set(false);
    if (!ok) {
      this.familyError.set(error?.message ?? 'No se pudo buscar');
      return;
    }
    this.joinable.set((data ?? []).filter((h) => !h.is_member));
  }

  async joinHouse(house: House): Promise<void> {
    if (this.familyBusy()) {
      return;
    }
    this.familyBusy.set(true);
    this.familyError.set('');
    const { ok, error } = await this.api.joinHouse(
      house.id_house,
      this.session.currentUser.username,
      this.session.idUser,
    );
    this.familyBusy.set(false);
    if (!ok) {
      this.familyError.set(error?.message ?? 'No se pudo unir al grupo');
      return;
    }
    this.familySearch = '';
    this.joinable.set([]);
    await this.loadHouses();
  }

  /**
   * Guardar o abrir la edicion.
   *
   * Antes solo cambiaba signals en memoria y ponia "Cambios guardados" sin
   * escribir nada: al recargar, nombre, correo, telefono y ubicacion volvian a
   * su valor original. Ahora espera a PUT /api/users/:id, y si el backend
   * rechaza (correo invalido, correo ya usado) se queda en modo edicion con el
   * motivo a la vista en vez de perder lo que el usuario escribio.
   */
  async toggleEdit(): Promise<void> {
    if (!this.editMode) {
      this.editMode = true;
      return;
    }
    if (this.saving) {
      return;
    }

    this.saving = true;
    try {
      const { data, ok, error } = await this.api.updateProfile(this.session.idUser, {
        name: this.draft.fullName.trim(),
        email: this.draft.email.trim(),
        phone: this.draft.phone.trim(),
        location: this.draft.location.trim(),
      });

      if (!ok || !data) {
        this.flash(error?.message ?? 'No se pudieron guardar los cambios');
        return;
      }

      // La sesion guarda el usuario en cookie y localStorage: sin actualizarla,
      // el topbar y el resto de la app seguirian mostrando el nombre anterior.
      this.session.patch({
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
      });
      this.applyUser(data);
      this.editMode = false;
      this.flash('Cambios guardados');
    } finally {
      this.saving = false;
    }
  }

  /** Vuelca los datos guardados en las señales que pinta la pantalla. */
  private applyUser(u: { name?: string; email?: string; phone?: string; location?: string }): void {
    if (u.name !== undefined) this.fullName.set(u.name);
    if (u.email !== undefined) this.email.set(u.email);
    if (u.phone !== undefined) this.phone.set(u.phone);
    if (u.location !== undefined) this.location.set(u.location);

    this.draft = {
      fullName: this.fullName(),
      email: this.email(),
      phone: this.phone(),
      location: this.location(),
    };
  }

  private flash(message: string): void {
    this.savedMessage = message;
    setTimeout(() => (this.savedMessage = ''), 2500);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    void this.uploadPhoto(file);
    input.value = '';
  }

  clearPhoto(): void {
    this.session.setAvatar('');
  }

  private async uploadPhoto(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.flash('Selecciona un archivo de imagen válido.');
      return;
    }
    try {
      const resized = await this.readResizedImage(file, 256);
      this.session.setAvatar(resized);
      const { ok } = await this.api.updateAvatar(this.session.idUser, resized);
      this.flash(ok ? 'Foto de perfil actualizada.' : 'Foto guardada (sin conexión al servidor).');
    } catch {
      this.flash('Ocurrió un error al procesar la imagen.');
    }
  }

  private readResizedImage(file: File, maxSide: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas no disponible'));
            return;
          }
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Imagen no válida'));
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  cancelEdit(): void {
    this.draft = {
      fullName: this.fullName(),
      email: this.email(),
      phone: this.phone(),
      location: this.location(),
    };
    this.editMode = false;
  }
  signOut(): void {
    this.session.clear();
    void this.router.navigate(['/login']);
  }
}
