import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Properties } from './properties/properties';
import { Steps } from './steps/steps';
import { PropertyByCity } from './property-by-city/property-by-city';
import { Agents } from './agents/agents';
import { Home } from './home/home';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Home, Properties, Steps, PropertyByCity, Agents],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

}
