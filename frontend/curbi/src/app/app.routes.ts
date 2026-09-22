import { Routes } from '@angular/router';
import { Login } from './component/login/login';
import { Register } from './component/register/register';
import { Home } from './component/home/home';
import { Profile } from './component/profile/profile';
import { Wallet } from './component/wallet/wallet';
import { Saves } from './component/saves/saves';
import { Transactions } from './component/transactions/transactions';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'profile', component: Profile },
  { path: 'wallet', component: Wallet },
  { path: 'saves', component: Saves },
  { path: 'transactions', component: Transactions },
  { path: '**', redirectTo: 'login' },
];
