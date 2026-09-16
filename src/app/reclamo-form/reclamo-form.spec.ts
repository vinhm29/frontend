import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReclamoForm } from './reclamo-form';

describe('ReclamoForm', () => {
  let component: ReclamoForm;
  let fixture: ComponentFixture<ReclamoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReclamoForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ReclamoForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
