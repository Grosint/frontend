import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AppStateStore } from './core/services/app-state.store';
import { WebVitalsService } from './core/services/web-vitals.service';
import { PwaService } from './core/services/pwa.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [RouterModule.forRoot([]), NoopAnimationsModule],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: AppStateStore,
          useValue: {
            setTheme: jasmine.createSpy('setTheme'),
            setLanguage: jasmine.createSpy('setLanguage'),
          },
        },
        {
          provide: WebVitalsService,
          useValue: {
            init: jasmine.createSpy('init'),
          },
        },
        {
          provide: PwaService,
          useValue: {},
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'GrosInt'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('GrosInt');
  });
});
