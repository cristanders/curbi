import { Component, OnDestroy, OnInit, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../service/session.service';
import { NotificationService } from '../../service/notification.service';

export type TopbarActive =
  | 'home'
  | 'wallet'
  | 'saves'
  | 'transactions'
  | 'notifications'
  | 'profile'
  | 'none';

@Component({
  imports: [RouterLink],
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
