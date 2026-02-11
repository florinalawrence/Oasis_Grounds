import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSpinner } from './common-spinner';

describe('CommonSpinner', () => {
  let component: CommonSpinner;
  let fixture: ComponentFixture<CommonSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonSpinner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonSpinner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
