import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-design',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './design.html',
  styleUrl: './design.scss',
})
export class Design {

}
