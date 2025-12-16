import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthTestService {

  constructor() { }

  /**
   * Test Google Authentication Configuration
   */
  testGoogleAuthConfig(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if Google Client ID is configured
    if (!environment.clientIdForGoogleLogin) {
      issues.push('Google Client ID is not configured in environment');
    } else if (!environment.clientIdForGoogleLogin.includes('.apps.googleusercontent.com')) {
      issues.push('Google Client ID format appears invalid');
    }
    
    // Check if API URL is configured
    if (!environment.baseApiUrl) {
      issues.push('API base URL is not configured');
    }
    
    // Check if application ID is configured
    if (!environment.applicationId) {
      issues.push('Application ID is not configured');
    }
    
    // Check current domain
    const currentDomain = window.location.hostname;
    const allowedDomains = ['localhost', '127.0.0.1', 'oasisgrounds.com'];
    const isDomainAllowed = allowedDomains.some(domain => 
      currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
    
    if (!isDomainAllowed) {
      issues.push(`Current domain '${currentDomain}' may not be authorized in Google Console`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Get Google Auth Debug Information
   */
  getDebugInfo(): any {
    return {
      environment: {
        production: environment.production,
        baseApiUrl: environment.baseApiUrl,
        clientId: environment.clientIdForGoogleLogin?.substring(0, 20) + '...',
        applicationId: environment.applicationId
      },
      browser: {
        userAgent: navigator.userAgent,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        url: window.location.href
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test Google API connectivity
   */
  testGoogleApiConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if Google API is loaded
      if (typeof window !== 'undefined' && (window as any).google) {
        resolve({
          status: 'success',
          message: 'Google API is loaded and available',
          apiVersion: (window as any).google?.accounts?.id ? 'GSI (Google Identity Services)' : 'Legacy'
        });
      } else {
        // Wait for Google API to load
        const checkInterval = setInterval(() => {
          if ((window as any).google) {
            clearInterval(checkInterval);
            resolve({
              status: 'success',
              message: 'Google API loaded successfully',
              apiVersion: (window as any).google?.accounts?.id ? 'GSI (Google Identity Services)' : 'Legacy'
            });
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject({
            status: 'error',
            message: 'Google API failed to load within 10 seconds',
            suggestions: [
              'Check internet connection',
              'Verify Google API script is included in index.html',
              'Check for ad blockers or script blockers'
            ]
          });
        }, 10000);
      }
    });
  }
}
