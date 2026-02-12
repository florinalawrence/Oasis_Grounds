import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/Session-service/session.service';
import { RoutePath } from '../constant/api.constant';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private session = inject(SessionService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const SERVER_URL = environment.baseApiUrl;
    const token = this.session.getToken();

    let updatedReq = req;

    // ✅ Prefix base API URL if missing
    if (!req.url.startsWith('http')) {
      updatedReq = updatedReq.clone({
        url: SERVER_URL + req.url,
      });
    }

    // ✅ Add Authorization header
    if (token) {
      updatedReq = updatedReq.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      console.warn('⚠️ No auth token found');
    }

    return next.handle(updatedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 402) {
          this.session.removeCredentials();
          this.router.navigate([RoutePath.LOGIN]);
        }
        return throwError(() => err);
      })
    );
  }
}

