import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPropertyPage } from './main-property-page';

describe('MainPropertyPage', () => {
  let component: MainPropertyPage;
  let fixture: ComponentFixture<MainPropertyPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPropertyPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPropertyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
