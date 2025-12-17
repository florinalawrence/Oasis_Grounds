import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { AllProperty } from './pages/all-property/all-property';
import { Register } from './pages/register/register';
import { MainPropertyPage } from './pages/details/main-property-page/main-property-page';
import { UserDashboard } from './pages/User_dashboard/user-dashboard/user-dashboard';
import { MyProperties } from './pages/User_dashboard/my-properties/my-properties';
import { EditProfile } from './pages/User_dashboard/edit-profile/edit-profile';
import { AddProperty } from './pages/User_dashboard/Add_Property/add-property/add-property';
import { Design } from './pages/design/design';
import { Estimation } from './pages/estimation/estimation';
import { Maintenance } from './pages/maintenance/maintenance';
import { ProjectManagement } from './pages/project-management/project-management';
import { Login } from './pages/login/login';
import { MyFavourites } from './pages/User_dashboard/my-favourites/my-favourites';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { OptVerificationScreen } from './pages/opt-verification-screen/opt-verification-screen';
import { provideRouter, withViewTransitions } from '@angular/router';
import { ChangePassword } from './pages/User_dashboard/change-password/change-password';

export const routes: Routes = [
    {
        path: '', redirectTo: 'home', pathMatch: 'full'
    },
    {
        path: 'home', component: Dashboard
    },
    {
        path: 'all-property', component: AllProperty
    },
    {
        path: 'about', component: About
    },
    {
        path: 'contact', component: Contact
    },
    {
        path: 'login', component: Login
    },
    {
        path: 'register', component: Register
    },
    {
        path: 'details', component: MainPropertyPage
    },
    {
        path: 'design', component: Design
    },
    {
        path: 'estimation', component: Estimation
    },
    {
        path: 'maintenance', component: Maintenance
    },
    {
        path: 'project', component: ProjectManagement
    },
    {
        path: 'forgot-password', component: ForgotPassword
    },
    {
        path: 'otp-verification', component: OptVerificationScreen
    },
    {
        path: 'user-dashboard',
        component: UserDashboard,
        children: [
            { path: '', redirectTo: 'edit-profile', pathMatch: 'full' },
            { path: 'edit-profile', component: EditProfile },
            { path: 'my-property', component: MyProperties },
            { path: 'favourites', component: MyFavourites },
            { path: 'add-property', component: AddProperty },
            { path: 'change-password', component: ChangePassword }
        ]
    },
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
