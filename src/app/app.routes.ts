import { Routes } from '@angular/router';
import { provideRouter, withViewTransitions } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    // Public pages - eager loaded for fast initial load
    {
        path: 'home',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'about',
        loadComponent: () => import('./pages/about/about').then(m => m.About)
    },
    {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact').then(m => m.Contact)
    },
    {
        path: 'all-property',
        loadComponent: () => import('./pages/all-property/all-property').then(m => m.AllProperty)
    },
    {
        path: 'details/:id',
        loadComponent: () => import('./pages/details/main-property-page/main-property-page').then(m => m.MainPropertyPage)
    },
    // Authentication routes - lazy loaded
    {
        path: '',
        loadChildren: () => import('./pages/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    // User dashboard - lazy loaded with auth guard
    {
        path: 'user-dashboard',
        loadChildren: () => import('./pages/User_dashboard/user-dashboard.routes').then(m => m.USER_DASHBOARD_ROUTES)
    },
    // Services pages - lazy loaded
    {
        path: '',
        loadChildren: () => import('./pages/services/services.routes').then(m => m.SERVICES_ROUTES)
    },
    // Fallback route
    {
        path: '**',
        redirectTo: 'home'
    }
];

// Export the `provideRouter` configuration
export const appConfig = {
  providers: [
    provideRouter(routes, withViewTransitions())
  ]
};
