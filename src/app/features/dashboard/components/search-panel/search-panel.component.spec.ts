import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SearchPanelComponent } from './search-panel.component';
import { SearchService } from '../../services/search.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SearchPanelComponent', () => {
  let component: SearchPanelComponent;
  let fixture: ComponentFixture<SearchPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchPanelComponent],
      imports: [FormsModule, NoopAnimationsModule],
      providers: [{ provide: SearchService, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
