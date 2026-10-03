import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../service/api.service';
import { SessionService } from '../../service/session.service';
import { LanguageService } from '../../service/language.service';

@Component({
  imports: [FormsModule, RouterLink, TranslatePipe],
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
  chatText = '';
  readonly error = signal('');
  readonly infoMessage = signal('');
  readonly chatResponse = signal('');
  readonly loading = signal(false);
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

    const name = this.fullName.trim();
    const username = this.username.trim();
    const email = this.email.trim();

    if (!name || !username || !email || !this.password) {
      this.error.set(
        this.translate.instant('REGISTER.ERROR_REQUIRED') ||
          'Por favor completa todos los campos obligatorios.',
      );
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      this.error.set(
        this.translate.instant('REGISTER.ERROR_EMAIL') ||
          'Por favor ingresa un correo electrónico válido.',
      );
      return;
    }

    if (this.password.length < 8) {
      this.error.set(
        this.translate.instant('REGISTER.ERROR_PASSWORD') ||
          'La contraseña debe tener al menos 8 caracteres.',
      );
      return;
    }

    if (!this.agreed) {
      this.error.set(
        this.translate.instant('REGISTER.ERROR_AGREED') ||
          'Debes aceptar la Política de Privacidad y los Términos de Servicio.',
      );
      return;
    }

    this.loading.set(true);
    const { data, ok, error } = await this.api.register({
      name,
      username,
      email,
      password: this.password,
      phone: this.phone.trim(),
    });
    this.loading.set(false);

    if (!ok || !data) {
      if (!ok && (error?.includes('No se pudo conectar') || !error)) {
        this.session.set(
          {
            id_user: 1,
            name,
            username,
            email,
            phone: this.phone.trim() || '+502 5555-0101',
          },
          true,
        );
        void this.router.navigate(['/home']);
        return;
      }
      this.error.set(
        error ??
          this.translate.instant('REGISTER.ERROR_SERVER') ??
          'No se pudo conectar con el servidor. Inténtalo de nuevo.',
      );
      return;
    }

    this.session.set(data.user, !!data.demo);
    void this.router.navigate(['/home']);
  }

  registerWithGoogle(): void {
    window.location.href = 'http://localhost:3000/api/auth/google';
  }

  registerWithOutlook(): void {
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

  onPrivacyPolicy(event: Event): void {
    event.preventDefault();
    this.infoMessage.set(
      'Política de Privacidad: CURBI protege tus datos bancarios y personales con cifrado TLS 1.3 de extremo a extremo.',
    );
  }

  onTerms(event: Event): void {
    event.preventDefault();
    this.infoMessage.set(
      'Términos de Servicio: El uso de CURBI está sujeto a nuestras directrices de finanzas personales responsables.',
    );
  }

  onSendChat(): void {
    const query = this.chatText.trim().toLowerCase();
    if (!query) {
      this.chatResponse.set(
        this.translate.instant('REGISTER.CHAT_TIP_DEFAULT') ||
          '¡Crea tu cuenta en CURBI para empezar a gestionar tus ahorros y metas!',
      );
      return;
    }
    if (query.includes('grat') || query.includes('free') || query.includes('cost')) {
      this.chatResponse.set(
        this.translate.instant('REGISTER.CHAT_TIP_FREE') ||
          '¡CURBI es 100% gratuito para ayudarte a alcanzar tu libertad financiera!',
      );
    } else {
      this.chatResponse.set(
        this.translate.instant('REGISTER.CHAT_TIP_GENERAL') ||
          'Completa el formulario a la derecha para unirte a CURBI en un minuto.',
      );
    }
    this.chatText = '';
  }

  chatTip(type: 'attach' | 'emoji' | 'mic'): void {
    if (type === 'attach') {
      this.chatResponse.set('📎 Podrás adjuntar documentos y recibos en tus transacciones.');
    } else if (type === 'emoji') {
      this.chatResponse.set('🚀 ¡Estamos emocionados de que formes parte de CURBI!');
    } else if (type === 'mic') {
      this.chatResponse.set('🎙️ El registro guiado por voz llegará en próximas versiones.');
    }
  }
}
