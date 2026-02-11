import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../services/loader.service';

@Component({
  selector: 'app-common-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="loader.loading$ | async">
      <div class="spinner"></div>
    </div>
  `,
  styleUrls: ['./common-spinner.scss']
})
export class CommonSpinner {
  readonly loader = inject(LoaderService);
}
