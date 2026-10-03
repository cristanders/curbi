import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { SessionService } from '../../service/session.service';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
      <p>Iniciando sesión con Google...</p>
    </div>
  `,
})
export class AuthSuccess implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.route.snapshot.queryParamMap.get('token') || this.route.snapshot.queryParams['token'];
      if (token) {
        localStorage.setItem('token', token);
        try {
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            const decodedJson = decodeURIComponent(
              atob(normalizedBase64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const user = JSON.parse(decodedJson);
            if (user?.id_user) {
              this.session.set(
                {
                  id_user: Number(user.id_user),
                  name: user.name || 'Usuario',
                  username: user.username || 'usuario',
                  email: user.email || '',
                  phone: user.phone || '',
                  avatar: user.avatar || '',
                  location: user.location || '',
                },
                false
              );
            }
          }
        } catch {
          /* Continuar navegación si no se puede parsear el token */
        }
      }
      void this.router.navigate(['/profile']);
    }
  }
}
