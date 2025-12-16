import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-property-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './property-header.html',
  styleUrl: './property-header.scss',
})
export class PropertyHeader {

}
