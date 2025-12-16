import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class Maintenance {

}
