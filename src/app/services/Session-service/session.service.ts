import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface OasisCredential {
  token?: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private http = inject(HttpClient);
  private baseApiUrl = environment.baseApiUrl;
  private readonly CREDENTIAL_KEY = 'oasisCredential';

  getCredentials(): OasisCredential | null {
    const data = localStorage.getItem(this.CREDENTIAL_KEY);
    return data ? JSON.parse(data) : null;
  }

  setCredentials(credentials: OasisCredential): void {
    localStorage.setItem(this.CREDENTIAL_KEY, JSON.stringify(credentials));
  }

  updateCredentials(updates: Partial<OasisCredential>): void {
    const current = this.getCredentials() || {};
    this.setCredentials({ ...current, ...updates });
  }

  getToken(): string | null {
    return this.getCredentials()?.token || null;
  }

  setToken(token: string): void {
    this.updateCredentials({ token });
  }

  removeCredentials(): void {
    localStorage.removeItem(this.CREDENTIAL_KEY);
  }

  refreshToken(): Observable<any> {
    const credentials = this.getCredentials();
    const refreshToken = credentials?.refreshToken;
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token found'));
    }

    return this.http.post<any>(`${this.baseApiUrl}/refresh-token`, { refreshToken }).pipe(
      catchError((err: any) => {
        const errorMessage = err.error?.headers?.message || 'Token refresh failed';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
