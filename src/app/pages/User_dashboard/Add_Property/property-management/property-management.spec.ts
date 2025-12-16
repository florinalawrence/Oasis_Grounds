import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyManagement } from './property-management';

describe('PropertyManagement', () => {
  let component: PropertyManagement;
  let fixture: ComponentFixture<PropertyManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
