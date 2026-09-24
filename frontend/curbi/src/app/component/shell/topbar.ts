import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type TopbarActive = 'home' | 'wallet' | 'saves' | 'transactions' | 'profile' | 'none';

@Component({
  imports: [RouterLink],
  selector: 'app-topbar',
  styleUrl: './topbar.css',
  templateUrl: './topbar.html',
})
export class Topbar {
  @Input({ required: true }) active: TopbarActive = 'none';
  avatarUrl = 'assets/images/avatar.png';
  brandUrl = 'assets/icons/curbi-logo.png';
}
