import { Routes } from '@angular/router';
import { authGuardGuard } from '../../core/guards/auth.guard';

export const USER_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-dashboard/user-dashboard').then(m => m.UserDashboard),
    canActivate: [authGuardGuard],
    data: { allowAccess: 'authenticated' },
    children: [
      {
        path: '',
        redirectTo: 'edit-profile',
        pathMatch: 'full'
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('./edit-profile/edit-profile').then(m => m.EditProfile)
      },
      {
        path: 'my-property',
        loadComponent: () => import('./my-properties/my-properties').then(m => m.MyProperties)
      },
      {
        path: 'favourites',
        loadComponent: () => import('./my-favourites/my-favourites').then(m => m.MyFavourites)
      },
      {
        path: 'add-property',
        loadComponent: () => import('./Add_Property/add-property/add-property').then(m => m.AddProperty)
      },
      {
        path: 'edit-property',
        loadComponent: () => import('./edit-property/edit-property').then(m => m.EditProperty)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./change-password/change-password').then(m => m.ChangePassword)
      }
    ]
  }
];
