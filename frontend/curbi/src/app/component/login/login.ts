import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../service/api.service';
import { SessionService } from '../../service/session.service';

@Component({
  imports: [FormsModule, RouterLink, TranslatePipe],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  email = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);
  readonly demoMode = signal(false);

  readonly mascot = 'assets/icons/curbi-mascot.png';
  readonly chatIcons = {
    attach: 'assets/icons/chat-attach.svg',
    emoji: 'assets/icons/chat-emoji.svg',
    mic: 'assets/icons/chat-mic.svg',
    send: 'assets/icons/chat-send.svg',
  };
  readonly googleIcon = 'assets/images/google.png';
  readonly outlookIcon = 'assets/images/outlook.png';

  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly translate = inject(TranslateService);

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    const { data, ok, error } = await this.api.login(this.email.trim(), this.password);
    this.loading.set(false);

    if (!ok || !data) {
      this.error.set(error ?? this.translate.instant('LOGIN.ERROR_SERVER'));
      return;
    }

    this.demoMode.set(!!data.demo);
    this.session.set(data.user, !!data.demo);
    void this.router.navigate(['/home']);
  }
}
