import { TestBed } from '@angular/core/testing';

import { SimulationAIService } from './simulation-aiservice';

describe('SimulationAIService', () => {
  let service: SimulationAIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimulationAIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
