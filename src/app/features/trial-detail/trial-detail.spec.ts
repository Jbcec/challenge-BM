import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrialDetail } from './trial-detail';

describe('TrialDetail', () => {
  let component: TrialDetail;
  let fixture: ComponentFixture<TrialDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrialDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrialDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
