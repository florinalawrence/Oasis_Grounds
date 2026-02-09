import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
  {
    path: 'design',
    loadComponent: () => import('../design/design').then(m => m.Design)
  },
  {
    path: 'estimation',
    loadComponent: () => import('../estimation/estimation').then(m => m.Estimation)
  },
  {
    path: 'maintenance',
    loadComponent: () => import('../maintenance/maintenance').then(m => m.Maintenance)
  },
  {
    path: 'project',
    loadComponent: () => import('../project-management/project-management').then(m => m.ProjectManagement)
  }
];
