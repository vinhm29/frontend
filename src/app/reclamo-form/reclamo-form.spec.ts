import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReclamoFormComponent } from './reclamo-form';

describe('ReclamoFormComponent', () => {
  let component: ReclamoFormComponent;
  let fixture: ComponentFixture<ReclamoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReclamoFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReclamoFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
