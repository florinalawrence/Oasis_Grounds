import { Router } from '@angular/router';
import { SessionService } from '../../services/Session-service/session.service';
import { RoutePath } from '../constant/api.constant';
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

// Define the guard
export const authGuardGuard: CanActivateFn = (route, state) => {
  // Injecting necessary services
  const router = inject(Router);
  const session = inject(SessionService);

  // Retrieve the allowAccess value from route data
  const allowAccess = route.data['allowAccess'];

  // Check if user has valid token
  const token = session.getToken();
  const isUserLoggedIn = !!token;

  // Check the authentication status based on the 'allowAccess' data in route
  if (allowAccess === 'authenticated' && !isUserLoggedIn) {
    // If user is not logged in and tries to access authenticated route
    router.navigate([RoutePath.LOGIN]);
    return false;
  }

  if (allowAccess === 'unauthenticated' && isUserLoggedIn) {
    // If user is logged in and tries to access unauthenticated route
    router.navigate([RoutePath.HOME]);
    return false;
  }

  // If none of the conditions match, allow access
  return true;
};
