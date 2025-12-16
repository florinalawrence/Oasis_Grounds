import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptVerificationScreen } from './opt-verification-screen';

describe('OptVerificationScreen', () => {
  let component: OptVerificationScreen;
  let fixture: ComponentFixture<OptVerificationScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptVerificationScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptVerificationScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
