import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'warning' | 'info' | 'success';
  showIcon?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  /**
   * Show modern confirmation dialog
   */
  async confirm(config: ConfirmationConfig): Promise<boolean> {
    const result = await Swal.fire({
      title: config.title,
      html: `
        <div class="modern-icon-container">
          ${this.getCustomIcon(config.type || 'warning')}
        </div>
        <div class="confirmation-message">${config.message}</div>
      `,
      icon: undefined, // Disable default icon
      showCancelButton: true,
      confirmButtonText: config.confirmText || 'Yes, proceed',
      cancelButtonText: config.cancelText || 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
      showCloseButton: false,
      customClass: {
        popup: 'modern-confirmation-popup',
        title: 'modern-confirmation-title',
        htmlContainer: 'modern-confirmation-content',
        confirmButton: 'modern-confirm-btn',
        cancelButton: 'modern-cancel-btn',
        actions: 'modern-actions'
      },
      buttonsStyling: false,
      backdrop: `
        rgba(0, 0, 0, 0.6)
        center
        no-repeat
      `,
      ...this.getTypeSpecificConfig(config.type || 'warning')
    });

    return result.isConfirmed;
  }

  /**
   * Show delete confirmation dialog
   */
  async confirmDelete(itemName: string = 'item'): Promise<boolean> {
    return this.confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete this ${itemName}?<br><small class="text-muted">This action cannot be undone.</small>`,
      confirmText: 'Yes, Delete',
      cancelText: 'Keep It',
      type: 'delete'
    });
  }

  /**
   * Show remove confirmation dialog
   */
  async confirmRemove(itemName: string = 'item'): Promise<boolean> {
    return this.confirm({
      title: 'Remove Confirmation',
      message: `Are you sure you want to remove this ${itemName}?<br><small class="text-muted">You can add it back later if needed.</small>`,
      confirmText: 'Yes, Remove',
      cancelText: 'Keep It',
      type: 'warning'
    });
  }

  /**
   * Show publish confirmation dialog
   */
  async confirmPublish(): Promise<boolean> {
    return this.confirm({
      title: 'Publish Property',
      message: `Ready to publish your property?<br><small class="text-muted">Once published, admin will review and verify your property.</small>`,
      confirmText: 'Yes, Publish',
      cancelText: 'Not Yet',
      type: 'info'
    });
  }

  private getCustomIcon(type: string): string {
    switch (type) {
      case 'delete':
        return `
          <svg class="modern-icon delete-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      case 'warning':
        return `
          <svg class="modern-icon warning-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64537 18.3024 1.55299 18.6453 1.55201 18.9945C1.55103 19.3437 1.64149 19.6871 1.81442 19.9905C1.98735 20.2939 2.23672 20.5467 2.53771 20.7239C2.83869 20.9011 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.9011 21.4623 20.7239C21.7633 20.5467 22.0127 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3438 2.89725 12 2.89725C11.6562 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      case 'info':
        return `
          <svg class="modern-icon info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      case 'success':
        return `
          <svg class="modern-icon success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4905 2.02168 11.3363C2.16356 9.18203 2.99721 7.13214 4.39828 5.49883C5.79935 3.86553 7.69279 2.72636 9.79619 2.24223C11.8996 1.75809 14.1003 1.95185 16.07 2.79999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      default:
        return `
          <svg class="modern-icon warning-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64537 18.3024 1.55299 18.6453 1.55201 18.9945C1.55103 19.3437 1.64149 19.6871 1.81442 19.9905C1.98735 20.2939 2.23672 20.5467 2.53771 20.7239C2.83869 20.9011 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.9011 21.4623 20.7239C21.7633 20.5467 22.0127 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3438 2.89725 12 2.89725C11.6562 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
    }
  }

  private getTypeSpecificConfig(type: string): any {
    switch (type) {
      case 'delete':
        return {
          iconColor: '#e74c3c',
          confirmButtonColor: '#e74c3c',
          cancelButtonColor: '#95a5a6'
        };
      case 'warning':
        return {
          iconColor: '#f39c12',
          confirmButtonColor: '#f39c12',
          cancelButtonColor: '#95a5a6'
        };
      case 'info':
        return {
          iconColor: '#3498db',
          confirmButtonColor: '#3498db',
          cancelButtonColor: '#95a5a6'
        };
      case 'success':
        return {
          iconColor: '#27ae60',
          confirmButtonColor: '#27ae60',
          cancelButtonColor: '#95a5a6'
        };
      default:
        return {
          iconColor: '#f39c12',
          confirmButtonColor: '#f39c12',
          cancelButtonColor: '#95a5a6'
        };
    }
  }
}