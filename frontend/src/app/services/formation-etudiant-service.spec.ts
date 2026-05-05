import { TestBed } from '@angular/core/testing';

import { FormationEtudiantService } from './formation-etudiant-service';

describe('FormationEtudiantService', () => {
  let service: FormationEtudiantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormationEtudiantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
