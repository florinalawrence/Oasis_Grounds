import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidenav } from '../sidenav/sidenav';
import { EditProfile } from '../edit-profile/edit-profile';
import { AddProperty } from '../Add_Property/add-property/add-property';
import { MyProperties } from '../my-properties/my-properties';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule,Sidenav, EditProfile, AddProperty, MyProperties, RouterOutlet],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.scss',
})
export class UserDashboard {

}
