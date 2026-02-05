import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../services/loader.service';

@Component({
  selector: 'app-common-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loader.loading$ | async) {
      <div class="loader-overlay">
        <div class="spinner"></div>
      </div>
    }
  `
})
export class CommonSpinner {
  constructor(public loader: LoaderService) {}
}

