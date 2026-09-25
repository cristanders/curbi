import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../service/session.service';

export type TopbarActive = 'home' | 'wallet' | 'saves' | 'transactions' | 'profile' | 'none';

@Component({
  imports: [RouterLink],
  selector: 'app-topbar',
  styleUrl: './topbar.css',
  templateUrl: './topbar.html',
})
export class Topbar {
  @Input({ required: true }) active: TopbarActive = 'none';
  readonly defaultAvatarUrl = 'assets/images/avatar.png';
  readonly brandUrl = 'assets/icons/curbi-logo.png';

  private readonly session = inject(SessionService);

  get avatarUrl(): string {
    return this.session.avatar || this.defaultAvatarUrl;
  }
}
