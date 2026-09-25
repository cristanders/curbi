import { Routes } from '@angular/router';
import { Login } from './component/login/login';
import { Register } from './component/register/register';
import { Home } from './component/home/home';
import { Profile } from './component/profile/profile';
import { Wallet } from './component/wallet/wallet';
import { Saves } from './component/saves/saves';
import { Transactions } from './component/transactions/transactions';
import { authGuard } from './service/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'wallet', component: Wallet, canActivate: [authGuard] },
  { path: 'saves', component: Saves, canActivate: [authGuard] },
  { path: 'transactions', component: Transactions, canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' },
];