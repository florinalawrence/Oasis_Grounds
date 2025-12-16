import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SimpleAlertService {

  showAlert(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    // Simple browser alert without icons
    alert(message);
  }

  showConfirm(message: string): boolean {
    return confirm(message);
  }

  showPrompt(message: string, defaultValue: string = ''): string | null {
    return prompt(message, defaultValue);
  }
}