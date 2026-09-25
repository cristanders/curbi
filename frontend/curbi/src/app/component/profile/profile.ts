import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Topbar } from '../shell/topbar';
import { ApiService, DashboardPayload } from '../../service/api.service';
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

  get avatarUrl(): string {
    return this.session.avatar || this.defaultAvatarUrl;
  }

  fullName = '';
  username = '';
  rank = 'Member';
  email = '';
  phone = '';
  memberSince = '';
  location = '';
  savings = '0';
  savingsDecimals = '00';
  savingsRange = '6 Months';
  savingsGoal = 'Q0.00';
  savingsProgress = 0;
  accountBalance = '0';
  accountDecimals = '00';
  totalSpent = '0.00';
  activeWallets = '0';
  source: 'api' | 'demo' = 'demo';

  editMode = false;
  notifications = true;
  biometricLogin = false;
  savedMessage = '';

  draft = {
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    location: this.location,
  };

  private data: DashboardPayload | null = null;

  constructor(
    private readonly router: Router,
    private readonly api: ApiService,
    readonly session: SessionService,
  ) {}

  async ngOnInit(): Promise<void> {
    const { data } = await this.api.dashboard(this.session.idUser);
    this.data = data;
    this.source = data ? 'api' : 'demo';

    const u = this.session.currentUser;
    this.fullName = u.name || '';
    this.username = u.username ? `@${u.username}` : '';
    this.email = u.email || '';
    this.phone = u.phone || '';

    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      location: this.location,
    };

    const s = this.data?.summary;
    if (!s) {
      return;
    }
    const f = (v: number) => Math.abs(v).toFixed(2).split('.');
    const bal = f(s.totalBalance);
    this.accountBalance = bal[0];
    this.accountDecimals = bal[1];

    const sav = f(s.totalSaved);
    this.savings = sav[0];
    this.savingsDecimals = sav[1];

    this.totalSpent = s.expense.toFixed(2);
    this.activeWallets = String(s.accountCount);

    const goal = this.data?.savingsGoals?.[0];
    if (goal) {
      const target = Number(goal.target_amount) || 1;
      const current = Number(goal.current_amount) || 0;
      this.savingsGoal = `Q${Number(goal.target_amount ?? 0).toFixed(2)}`;
      this.savingsProgress = Math.min(100, Math.round((current / target) * 100));
    }
  }

  toggleEdit(): void {
    if (this.editMode) {
      this.fullName = this.draft.fullName;
      this.email = this.draft.email;
      this.phone = this.draft.phone;
      this.location = this.draft.location;
      this.savedMessage = 'Cambios guardados';
      setTimeout(() => (this.savedMessage = ''), 2500);
    }
    this.editMode = !this.editMode;
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
      this.savedMessage = 'Selecciona un archivo de imagen válido.';
      setTimeout(() => (this.savedMessage = ''), 2500);
      return;
    }
    try {
      const resized = await this.readResizedImage(file, 256);
      this.session.setAvatar(resized);
      const { ok } = await this.api.updateAvatar(this.session.idUser, resized);
      this.savedMessage = ok
        ? 'Foto de perfil actualizada.'
        : 'Foto guardada (sin conexión al servidor).';
      setTimeout(() => (this.savedMessage = ''), 2500);
    } catch {
      this.savedMessage = 'Ocurrió un error al procesar la imagen.';
      setTimeout(() => (this.savedMessage = ''), 2500);
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
        img.onerror = () => reject(new Error('Imagen inválida'));
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  cancelEdit(): void {
    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      location: this.location,
    };
    this.editMode = false;
  }

  signOut(): void {
    this.session.clear();
    void this.router.navigate(['/login']);
  }
}
