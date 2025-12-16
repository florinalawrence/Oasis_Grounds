import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-estimation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './estimation.html',
  styleUrl: './estimation.scss',
})
export class Estimation {

}
