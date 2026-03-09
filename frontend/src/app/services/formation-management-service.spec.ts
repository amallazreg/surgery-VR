import { TestBed } from '@angular/core/testing';

import { FormationManagementService } from './formation-management-service';

describe('FormationManagementService', () => {
  let service: FormationManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormationManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
