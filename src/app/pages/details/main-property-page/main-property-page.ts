import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyGallery } from '../property-gallery/property-gallery';
import { PropertyDetails } from '../property-details/property-details';
import { PropertyHeader } from '../property-header/property-header';
import { ContactAgent } from '../contact-agent/contact-agent';

@Component({
  selector: 'app-main-property-page',
  standalone: true,
  imports: [CommonModule, PropertyGallery, PropertyDetails, PropertyHeader, ContactAgent],
  templateUrl: './main-property-page.html',
  styleUrl: './main-property-page.scss',
})
export class MainPropertyPage {

}
