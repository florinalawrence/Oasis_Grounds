import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentAttachment } from './document-attachment';

describe('DocumentAttachment', () => {
  let component: DocumentAttachment;
  let fixture: ComponentFixture<DocumentAttachment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentAttachment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentAttachment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
