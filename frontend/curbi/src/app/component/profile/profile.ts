import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Topbar } from '../shell/topbar';
import { ApiService, DashboardPayload } from '../../service/api.service';
import { DemoDataService } from '../../service/demo-data.service';
import { SessionService } from '../../service/session.service';

@Component({
  imports: [FormsModule, NgIf, Topbar],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  readonly avatarUrl = 'assets/images/avatar.png';
  readonly verifiedUrl = 'assets/icons/verified.png';
  readonly savingsIconUrl = 'assets/icons/savings-pig.png';

  fullName = 'Brayan Oswaldo Compa Fuentes';
  username = '@brayancompaa';
  rank = 'Repulsive Buyer';
  email = 'brayan.compa@curbi.com';
  phone = '+502 5555-1234';
  memberSince = 'March 2025';
  location = 'Guatemala City, GT';
  savings = '17';
  savingsDecimals = '00';
  savingsRange = '6 Months';
  savingsGoal = 'Q42.00';
  savingsProgress = 40;
  accountBalance = '67';
  accountDecimals = '95';
  totalSpent = '124.59';
  activeWallets = '3';
  source: 'api' | 'demo' = 'demo';

  editMode = false;
  notifications = true;
  biometricLogin = false;
  savedMessage = '';

  draft = {
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    location: this.location,
  };

  private data: DashboardPayload | null = null;

  constructor(
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly demo: DemoDataService,
    private readonly session: SessionService,
  ) {}

  async ngOnInit(): Promise<void> {
    const { data, ok } = await this.api.dashboard(this.session.idUser);
    this.data = data ?? this.demo.dashboard();
    this.source = ok && data ? 'api' : 'demo';

    const u = this.session.currentUser;
    this.fullName = u.name || this.fullName;
    this.username = `@${u.username || 'brayancampa'}`;
    this.email = u.email || this.email;
    this.phone = u.phone || this.phone;

    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      location: this.location,
    };

    const s = this.data!.summary;
    const f = (v: number) => Math.abs(v).toFixed(2).split('.');
    const bal = f(s.totalBalance || 67.95);
    this.accountBalance = bal[0];
    this.accountDecimals = bal[1];

    const sav = f(s.totalSaved || 17);
    this.savings = sav[0];
    this.savingsDecimals = sav[1];

    this.totalSpent = (s.expense || 124.59).toFixed(2);
    this.activeWallets = String(s.accountCount || 3);

    const goalTarget = 42;
    const savedAmount = s.totalSaved || 17;
    this.savingsGoal = `Q${goalTarget.toFixed(2)}`;
    this.savingsProgress = Math.max(
      5,
      Math.min(100, Math.round((savedAmount / goalTarget) * 100)),
    );
  }

  toggleEdit(): void {
    if (this.editMode) {
      this.fullName = this.draft.fullName;
      this.email = this.draft.email;
      this.phone = this.draft.phone;
      this.location = this.draft.location;
      this.savedMessage = 'Cambios guardados';
      setTimeout(() => (this.savedMessage = ''), 2500);
    }
    this.editMode = !this.editMode;
  }

  cancelEdit(): void {
    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      location: this.location,
    };
    this.editMode = false;
  }

  signOut(): void {
    this.session.clear();
    void this.router.navigate(['/login']);
  }
}
