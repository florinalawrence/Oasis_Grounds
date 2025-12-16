import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  showToast(message: any, type: 'success' | 'error' | 'warning' | 'info') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })

    Toast.fire({
      text: message,
      icon: type,
      position: 'top-end',
    });
  }
}

