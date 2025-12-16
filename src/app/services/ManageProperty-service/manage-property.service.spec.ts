import { TestBed } from '@angular/core/testing';

import { ManagePropertyService } from './manage-property.service';

describe('ManagePropertyService', () => {
  let service: ManagePropertyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagePropertyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
