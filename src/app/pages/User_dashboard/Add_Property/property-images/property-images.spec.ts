import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyImages } from './property-images';

describe('PropertyImages', () => {
  let component: PropertyImages;
  let fixture: ComponentFixture<PropertyImages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyImages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyImages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
