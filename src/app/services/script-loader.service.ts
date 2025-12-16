import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScriptLoaderService {
  private loadedScripts: { [key: string]: boolean } = {};

  constructor() { }

  /**
   * Load external script dynamically
   */
  loadScript(scriptId: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (this.loadedScripts[scriptId]) {
        resolve();
        return;
      }

      // Check if script element already exists
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        this.loadedScripts[scriptId] = true;
        resolve();
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = src;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.loadedScripts[scriptId] = true;
        console.log(`✅ Script loaded successfully: ${scriptId}`);
        resolve();
      };

      script.onerror = (error) => {
        console.error(`❌ Failed to load script: ${scriptId}`, error);
        reject(new Error(`Failed to load script: ${scriptId}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Load Google API scripts
   */
  async loadGoogleApis(): Promise<void> {
    try {
      // Load Google API Platform Library
      await this.loadScript('google-platform', 'https://apis.google.com/js/platform.js');
      
      // Wait a bit for the API to initialize
      await this.waitForGoogleApi();
      
      console.log('✅ Google APIs loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Google APIs:', error);
      throw error;
    }
  }

  /**
   * Wait for Google API to be available
   */
  private waitForGoogleApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      const checkGoogleApi = () => {
        attempts++;
        
        if ((window as any).gapi) {
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('Google API failed to initialize within timeout'));
          return;
        }

        setTimeout(checkGoogleApi, 100);
      };

      checkGoogleApi();
    });
  }

  /**
   * Check if Google API is loaded
   */
  isGoogleApiLoaded(): boolean {
    return !!(window as any).gapi;
  }
}