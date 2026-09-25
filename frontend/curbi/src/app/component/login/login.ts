import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { SessionService } from '../../service/session.service';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  email = '';
  password = '';
  error = '';
  loading = false;
  demoMode = false;

  readonly mascot = 'assets/icons/curbi-mascot.png';
  readonly chatIcons = {
    attach: 'assets/icons/chat-attach.svg',
    emoji: 'assets/icons/chat-emoji.svg',
    mic: 'assets/icons/chat-mic.svg',
    send: 'assets/icons/chat-send.svg',
  };
  readonly googleIcon = 'assets/images/google.png';
  readonly outlookIcon = 'assets/images/outlook.png';

  constructor(
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly session: SessionService,
  ) {}

  async onSubmit(): Promise<void> {
    this.error = '';
    this.loading = true;

    const { data, ok, error } = await this.api.login(this.email.trim(), this.password);
    this.loading = false;

    if (!ok || !data) {
      this.error = error ?? 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
      return;
    }

    this.demoMode = !!data.demo;
    this.session.set(data.user, !!data.demo);
    void this.router.navigate(['/home']);
  }
}
