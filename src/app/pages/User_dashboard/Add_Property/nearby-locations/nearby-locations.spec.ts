import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NearbyLocations } from './nearby-locations';

describe('NearbyLocations', () => {
  let component: NearbyLocations;
  let fixture: ComponentFixture<NearbyLocations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NearbyLocations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NearbyLocations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
