import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'trials', pathMatch: 'full' },
  { path: 'trials', loadComponent: () => import('./features/trials-list/trials-list').then(m => m.TrialsListComponent) },
  { path: 'trials/:nctId', loadComponent: () => import('./features/trial-detail/trial-detail').then(m => m.TrialDetailComponent) },
  { path: '**', redirectTo: 'trials' }
];
