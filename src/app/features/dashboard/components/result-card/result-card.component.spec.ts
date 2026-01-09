import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultCardComponent } from './result-card.component';
import { SearchResultItem } from '../../models/search.model';

describe('ResultCardComponent', () => {
  let component: ResultCardComponent;
  let fixture: ComponentFixture<ResultCardComponent>;

  const mockResult: SearchResultItem = {
    found: true,
    value: 'Test Value',
    category: 'test',
    source: 'test-source',
    type: 'test-type',
    confidence: 95,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResultCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultCardComponent);
    component = fixture.componentInstance;
    component.result = mockResult;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
