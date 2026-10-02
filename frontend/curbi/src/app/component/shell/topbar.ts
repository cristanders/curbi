import { Component, OnDestroy, OnInit, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionService } from '../../service/session.service';
import { NotificationService } from '../../service/notification.service';
import { LanguageService } from '../../service/language.service';

export type TopbarActive =
  | 'home'
  | 'wallet'
  | 'saves'
  | 'transactions'
  | 'learn'
  | 'notifications'
  | 'profile'
  | 'none';

@Component({
  imports: [RouterLink, TranslatePipe],
  selector: 'app-topbar',
  styleUrl: './topbar.css',
  templateUrl: './topbar.html',
})
export class Topbar implements OnInit, OnDestroy {
  @Input({ required: true }) active: TopbarActive = 'none';
  readonly defaultAvatarUrl = 'assets/images/avatar.png';
  readonly brandUrl = 'assets/icons/curbi-logo.png';

  private readonly session = inject(SessionService);
  private readonly notifications = inject(NotificationService);
  readonly languageService = inject(LanguageService);

  async onLanguageChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    if (select?.value) {
      await this.languageService.changeLanguage(select.value);
    }
  }

  get avatarUrl(): string {
    return this.session.avatar || this.defaultAvatarUrl;
  }

  get unread(): number {
    return this.notifications.unread();
  }

  ngOnInit(): void {
    this.notifications.attach();
  }

  ngOnDestroy(): void {
    this.notifications.detach();
  }
}
