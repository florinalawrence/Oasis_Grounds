import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/Auth-service/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/Session-service/session.service';
import { RoutePath } from '../constant/api.constant';
import { inject } from '@angular/core'; // Importing inject for Angular 20

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Using inject() for Angular 20 and later
  private authService = inject(AuthService);
  private session = inject(SessionService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const SERVER_URL = environment.baseApiUrl;
    const authToken = this.session.getToken(); // Use SessionService instead of direct localStorage
    const reqObj = { url: req.url, headers: req.headers };

    // Debug logging for API calls
    if (req.url.includes('profile') || req.url.includes('property')) {
      console.log('🔍 Interceptor: API request detected');
      console.log('🔑 Interceptor: Auth token exists:', authToken ? 'YES' : 'NO');
      console.log('📡 Interceptor: Request URL:', req.url);
      console.log('🔑 Interceptor: Token length:', authToken ? authToken.length : 0);
    }

    // Append the base API URL to the request if not already included
    if (!req.url.includes(SERVER_URL)) {
      if (req.url.indexOf('http://') === -1 && req.url.indexOf('https://') === -1) {
        reqObj.url = SERVER_URL + req.url;
      }
    }

    // Add Authorization header if authToken exists
    if (authToken) {
      reqObj.headers = reqObj.headers.set('Authorization', 'Bearer ' + authToken);
      if (req.url.includes('profile') || req.url.includes('property')) {
        console.log('✅ Interceptor: Authorization header added to request');
      }
    } else if (req.url.includes('profile') || req.url.includes('property')) {
      console.warn('⚠️ Interceptor: No auth token found for API request');
    }

    // Clone the request with modified headers
    const clonedReq = req.clone(reqObj);

    return next.handle(clonedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 402) {
          this.session.removeCredentials(); // Clear credentials if unauthorized or payment required
          this.router.navigate([RoutePath.LOGIN]);
          return []; // Empty observable to handle the error and prevent further processing
        }
        return throwError(() => err); // For any other errors, rethrow the error
      })
    );
  }
}
