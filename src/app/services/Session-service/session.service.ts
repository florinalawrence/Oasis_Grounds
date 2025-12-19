import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface OasisCredential {
  token?: string;
  refreshToken?: string;
  loginMethod?: 'email' | 'google';
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
    const credentials = this.getCredentials();
    const token = credentials?.token || null;
    
    console.log(' SessionService getToken() called');
    console.log(' Credentials found:', !!credentials);
    console.log(' Token found:', !!token);
    
    return token;
  }

  // In session.service.ts - ADD THIS METHOD
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token; // Returns true if token exists, false otherwise
  }

  /**
   * Set login method (email or google)
   */
  setLoginMethod(method: 'email' | 'google'): void {
    this.updateCredentials({ loginMethod: method });
  }

  /**
   * Get login method
   */
  getLoginMethod(): 'email' | 'google' | null {
    const credentials = this.getCredentials();
    return credentials?.loginMethod || null;
  }

  /**
   * Check if user logged in with Google
   */
  isGoogleLogin(): boolean {
    return this.getLoginMethod() === 'google';
  }

  /**
   * Check if user logged in with email/password
   */
  isEmailLogin(): boolean {
    return this.getLoginMethod() === 'email';
  }

  /**
   * Remove credentials and clear session
   */
  removeCredentials(): void {
    localStorage.removeItem(this.CREDENTIAL_KEY);
    this.clearUserData(); // Also clear user data on logout
  }

  /**
   * Set token with login method
   */
  setToken(token: string, loginMethod: 'email' | 'google' = 'email'): void {
    this.setCredentials({ token, loginMethod });
  }

  /**
   * Store user data in session storage for persistence across page refreshes
   */
  setUserData(userData: any): void {
    if (userData) {
      localStorage.setItem('oasisUserData', JSON.stringify(userData));
      console.log(' SessionService: User data stored in localStorage');
    }
  }

  /**
   * Get stored user data from session storage
   */
  getUserData(): any {
    const data = localStorage.getItem('oasisUserData');
    const userData = data ? JSON.parse(data) : null;
    console.log(' SessionService: Retrieved user data from localStorage:', !!userData);
    return userData;
  }

  /**
   * Clear stored user data
   */
  clearUserData(): void {
    localStorage.removeItem('oasisUserData');
    console.log(' SessionService: User data cleared from localStorage');
  }

  // Alias for removeCredentials for backward compatibility
  logOut(): void {
    this.removeCredentials();
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
