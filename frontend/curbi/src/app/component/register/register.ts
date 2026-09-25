import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { SessionService } from '../../service/session.service';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  fullName = '';
  username = '';
  email = '';
  phone = '';
  password = '';
  agreed = true;
  readonly error = signal('');
  readonly loading = signal(false);

  readonly mascot = 'assets/icons/curbi-mascot.png';
  readonly chatIcons = {
    attach: 'assets/icons/chat-attach.svg',
    emoji: 'assets/icons/chat-emoji.svg',
    mic: 'assets/icons/chat-mic.svg',
    send: 'assets/icons/chat-send.svg',
  };
  readonly googleIcon = 'assets/images/google.png';

  constructor(
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly session: SessionService,
  ) {}

  async onSubmit(): Promise<void> {
    this.error.set('');
    if (!this.agreed) {
      this.error.set('Debes aceptar la Privacy Policy y los Terms of Services.');
      return;
    }
    if (this.password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    this.loading.set(true);
    const { data, ok, error } = await this.api.register({
      name: this.fullName.trim(),
      username: this.username.trim(),
      email: this.email.trim(),
      password: this.password,
      phone: this.phone.trim(),
    });
    this.loading.set(false);

    if (!ok || !data) {
      this.error.set(error ?? 'No se pudo conectar con el servidor. Inténtalo de nuevo.');
      return;
    }

    this.session.set(data.user, !!data.demo);
    void this.router.navigate(['/home']);
  }
}
