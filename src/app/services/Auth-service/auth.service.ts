import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthEndPoints } from '../../core/constant/api.constant';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private authApiUrl = environment.authApiUrl;

  createPassword(userData: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}${AuthEndPoints.CREATE_PWD}`, userData).pipe(
      catchError((err: any) => {
        const errorMessage = err.error?.headers?.message || 'Create password failed';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  loginUser(loginReq: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}${AuthEndPoints.LOGIN_USER}`, loginReq).pipe(
      catchError((err: any) => {
        const errorMessage = err.error?.headers?.message || 'Login failed';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  loginWithGoogle(loginReq: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}${AuthEndPoints.GOOGLE_LOGIN}`, loginReq).pipe(
      catchError((err: any) => {
        const errorMessage = err.error?.headers?.message || 'Google login failed';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.authApiUrl}/refresh-token`, { refreshToken }).pipe(
      catchError((err: any) => {
        const errorMessage = err.error?.headers?.message || 'Token refresh failed';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
