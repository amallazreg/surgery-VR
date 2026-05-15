import { TestBed } from '@angular/core/testing';

import { RapportSimulation } from './rapport-simulation';

describe('RapportSimulation', () => {
  let service: RapportSimulation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapportSimulation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
