import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserProfileComponent } from './user-profile.component';
import { AppStateStore } from '@core/services/app-state.store';
import { AuthService } from '@core/services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserProfileComponent],
      imports: [NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AppStateStore, useValue: { user: () => null } },
        { provide: AuthService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
