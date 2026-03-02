import { TestBed } from '@angular/core/testing';

import { Experiences } from './experiences';

describe('Experiences', () => {
  let service: Experiences;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Experiences);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
