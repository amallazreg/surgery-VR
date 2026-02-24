import { TestBed } from '@angular/core/testing';

import { Payement } from './payement';

describe('Payement', () => {
  let service: Payement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Payement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
