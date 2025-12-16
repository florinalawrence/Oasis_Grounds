import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './project-management.html',
  styleUrl: './project-management.scss',
})
export class ProjectManagement {

}
