// import { Injectable } from '@angular/core';
// import Swal from 'sweetalert2';
// @Injectable({
//   providedIn: 'root'
// })
// export class ToastService {
//   showToast(message: any, type: 'success' | 'error' | 'warning' | 'info') {
//     const Toast = Swal.mixin({
//       toast: true,
//       position: 'top-end',
//       showConfirmButton: false,
//       timer: 2000,
//       timerProgressBar: true,
//       didOpen: (toast) => {
//         toast.addEventListener('mouseenter', Swal.stopTimer)
//         toast.addEventListener('mouseleave', Swal.resumeTimer)
//       }
//     })

//     Toast.fire({
//       text: message,
//       icon: type,
//       position: 'top-end',
//     });
//   }
// }

import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'question';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastConfig = {
    toast: true,
    position: 'top-end' as const,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast: HTMLElement) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  };

  showToast(message: string, type: ToastType) {
    // Create toast with specific configuration
    const Toast = Swal.mixin({
      ...this.toastConfig,
      customClass: {
        popup: `swal2-toast swal2-toast-${type}`
      }
    });

    Toast.fire({
      icon: type,
      text: message,
      position: 'top-end',
    });
  }
}