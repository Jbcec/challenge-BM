import { TestBed } from '@angular/core/testing';

import { Trials } from './trials';

describe('Trials', () => {
  let service: Trials;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Trials);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
