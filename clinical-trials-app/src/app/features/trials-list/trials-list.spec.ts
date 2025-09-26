import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrialsList } from './trials-list';

describe('TrialsList', () => {
  let component: TrialsList;
  let fixture: ComponentFixture<TrialsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrialsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrialsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
