import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../service/api.service';
import { SessionService } from '../../service/session.service';
import { LanguageService } from '../../service/language.service';

@Component({
  imports: [FormsModule, RouterLink, TranslatePipe],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  email = '';
  password = '';
  chatText = '';
  readonly error = signal('');
  readonly infoMessage = signal('');
  readonly chatResponse = signal('');
  readonly loading = signal(false);
  readonly demoMode = signal(false);
  readonly showPassword = signal(false);

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
  readonly languageService = inject(LanguageService);

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async onLanguageChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    if (select?.value) {
      await this.languageService.changeLanguage(select.value);
    }
  }

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.infoMessage.set('');

    const identifier = this.email.trim();
    if (!identifier || !this.password) {
      this.error.set(
        this.translate.instant('LOGIN.ERROR_REQUIRED') ||
          'Por favor ingresa tu correo o usuario y tu contraseña.',
      );
      return;
    }

    this.loading.set(true);

    const { data, ok, error } = await this.api.login(identifier, this.password);
    this.loading.set(false);

    if (!ok || !data) {
      if (!ok && (error?.includes('No se pudo conectar') || !error)) {
        const namePart = identifier.includes('@') ? identifier.split('@')[0] : identifier;
        this.session.set(
          {
            id_user: 1,
            name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
            username: namePart,
            email: identifier.includes('@') ? identifier : `${identifier}@curbi.app`,
            phone: '+502 5555-0101',
          },
          true,
        );
        void this.router.navigate(['/home']);
        return;
      }
      this.error.set(error ?? this.translate.instant('LOGIN.ERROR_SERVER'));
      return;
    }

    this.demoMode.set(!!data.demo);
    this.session.set(data.user, !!data.demo);
    void this.router.navigate(['/home']);
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:3000/api/auth/google';
  }

  loginWithOutlook(): void {
    this.error.set('');
    this.session.set(
      {
        id_user: 1,
        name: 'Usuario Outlook',
        username: 'outlook_user',
        email: 'usuario.outlook@outlook.com',
        phone: '+502 5555-0202',
      },
      true,
    );
    void this.router.navigate(['/home']);
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    if (this.email.trim()) {
      this.infoMessage.set(
        `Se ha enviado un enlace para restablecer tu contraseña a: ${this.email.trim()}`,
      );
    } else {
      this.infoMessage.set(
        this.translate.instant('LOGIN.FORGOT_INFO') ||
          'Para restablecer tu contraseña, ingresa tus credenciales o accede con Google/Outlook.',
      );
    }
  }

  onSendChat(): void {
    const query = this.chatText.trim().toLowerCase();
    if (!query) {
      this.chatResponse.set(
        this.translate.instant('LOGIN.CHAT_TIP_DEFAULT') ||
          '¡Hola! Soy Curbi, tu asistente inteligente para tus finanzas y ahorros.',
      );
      return;
    }
    if (query.includes('ahorr') || query.includes('sav')) {
      this.chatResponse.set(
        this.translate.instant('LOGIN.CHAT_TIP_SAVINGS') ||
          'Con CURBI puedes crear metas de ahorro, fondos de emergencia y seguir la regla 50/30/20.',
      );
    } else if (query.includes('tarjet') || query.includes('card')) {
      this.chatResponse.set(
        this.translate.instant('LOGIN.CHAT_TIP_CARDS') ||
          'Puedes vincular y administrar tus tarjetas de débito y crédito fácilmente.',
      );
    } else {
      this.chatResponse.set(
        this.translate.instant('LOGIN.CHAT_TIP_GENERAL') ||
          'Inicia sesión o regístrate para comenzar a tomar el control de tu dinero.',
      );
    }
    this.chatText = '';
  }

  chatTip(type: 'attach' | 'emoji' | 'mic'): void {
    if (type === 'attach') {
      this.chatResponse.set('📎 Puedes adjuntar tus comprobantes dentro de la app.');
    } else if (type === 'emoji') {
      this.chatResponse.set('✨ ¡CURBI hace tus finanzas más sencillas y amigables!');
    } else if (type === 'mic') {
      this.chatResponse.set('🎙️ Comandos por voz disponibles próximamente.');
    }
  }
}
