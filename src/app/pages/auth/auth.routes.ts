import { Routes } from '@angular/router';
import { authGuardGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../login/login').then(m => m.Login),
    canActivate: [authGuardGuard],
    data: { allowAccess: 'unauthenticated' }
  },
  {
    path: 'register',
    loadComponent: () => import('../register/register').then(m => m.Register),
    canActivate: [authGuardGuard],
    data: { allowAccess: 'unauthenticated' }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('../forgot-password/forgot-password').then(m => m.ForgotPassword),
    canActivate: [authGuardGuard],
    data: { allowAccess: 'unauthenticated' }
  },
  {
    path: 'otp-verification',
    loadComponent: () => import('../opt-verification-screen/opt-verification-screen').then(m => m.OptVerificationScreen)
  },
  {
    path: 'resetPassword',
    loadComponent: () => import('../reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: 'resetPassword/:id',
    loadComponent: () => import('../reset-password/reset-password').then(m => m.ResetPassword)
  }
];
