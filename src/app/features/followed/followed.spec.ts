import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Followed } from './followed';

describe('Followed', () => {
  let component: Followed;
  let fixture: ComponentFixture<Followed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Followed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Followed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
