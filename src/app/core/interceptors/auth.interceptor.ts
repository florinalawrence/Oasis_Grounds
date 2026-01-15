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
import { inject } from '@angular/core';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private session = inject(SessionService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const SERVER_URL = environment.baseApiUrl;
    const authToken = this.session.getToken();
    const reqObj = { url: req.url, headers: req.headers };
    console.log('AuthInterceptor: Intercepting request to', req.url);

    if (req.url.includes('profile') || req.url.includes('property')) {
      console.log('Interceptor: API request detected');
      console.log('Interceptor: Auth token exists:', authToken ? 'YES' : 'NO');
      console.log('Interceptor: Request URL:', req.url);
      console.log('Interceptor: Token length:', authToken ? authToken.length : 0);
    }

    if (!req.url.includes(SERVER_URL)) {
      if (req.url.indexOf('http://') === -1 && req.url.indexOf('https://') === -1) {
        reqObj.url = SERVER_URL + req.url;
      }
    }

    if (authToken) {
      reqObj.headers = reqObj.headers.set('Authorization', 'Bearer ' + authToken);
      if (req.url.includes('profile') || req.url.includes('property')) {
        console.log('Interceptor: Authorization header added to request');
      }
    } else if (req.url.includes('profile') || req.url.includes('property')) {
      console.warn('Interceptor: No auth token found for API request');
    }

    const clonedReq = req.clone(reqObj);

    return next.handle(clonedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 402) {
          this.session.removeCredentials();
          this.router.navigate([RoutePath.LOGIN]);
          return [];
        }
        return throwError(() => err);
      })
    );
  }
}
