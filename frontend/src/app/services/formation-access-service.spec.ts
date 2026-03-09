import { TestBed } from '@angular/core/testing';

import { FormationAccessService } from './formation-access-service';

describe('FormationAccessService', () => {
  let service: FormationAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormationAccessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
