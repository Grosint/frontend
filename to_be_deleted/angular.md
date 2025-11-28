# Angular Application Architecture Blueprint

## Table of Contents
1. [Project Structure](#project-structure)
2. [Core Architecture](#core-architecture)
3. [Performance Strategy](#performance-strategy)
4. [PWA Implementation](#pwa-implementation)
5. [Internationalization (i18n)](#internationalization)
6. [Mobile-First Responsive Design](#mobile-first-responsive-design)
7. [UI Component Library](#ui-component-library)
8. [Theming System](#theming-system)
9. [SCSS Architecture](#scss-architecture)
10. [Security Implementation](#security-implementation)
11. [Build Configuration](#build-configuration)
12. [Development Workflow](#development-workflow)

## Project Structure

```
src/
├── app/
│   ├── core/                      # Core module (singletons)
│   │   ├── services/              # Global services
│   │   ├── interceptors/          # HTTP interceptors
│   │   ├── guards/                # Route guards
│   │   ├── models/                # Data models/interfaces
│   │   └── utils/                 # Utility functions
│   │
│   ├── features/                  # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── [feature-name]/
│   │       ├── components/
│   │       ├── services/
│   │       ├── models/
│   │       └── [feature].module.ts
│   │
│   ├── shared/                    # Shared module
│   │   ├── components/            # Reusable components
│   │   ├── directives/            # Custom directives
│   │   ├── pipes/                 # Custom pipes
│   │   └── shared.module.ts
│   │
│   ├── ui/                        # UI Component Library
│   │   ├── components/            # Base UI components
│   │   ├── layouts/               # Layout components
│   │   └── ui.module.ts
│   │
│   └── app-routing.module.ts
│
├── assets/
│   ├── i18n/                      # Translation files
│   ├── icons/                     # App icons
│   ├── images/                    # Images
│   └── fonts/                     # Custom fonts
│
├── styles/
│   ├── abstracts/                 # SCSS abstracts
│   │   ├── _variables.scss        # Variables
│   │   ├── _mixins.scss          # Mixins
│   │   ├── _functions.scss       # Functions
│   │   └── _breakpoints.scss     # Breakpoints
│   │
│   ├── base/                      # Base styles
│   │   ├── _reset.scss
│   │   ├── _typography.scss
│   │   └── _global.scss
│   │
│   ├── themes/                    # Theme files
│   │   ├── _theme-default.scss
│   │   ├── _theme-dark.scss
│   │   └── _material-theme.scss  # Angular Material theme
│   │
│   └── main.scss                  # Main style entry
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── manifest.json                  # PWA manifest
```

## Core Architecture

### 1. Module Architecture

```typescript
// Core Module (Singleton services)
@NgModule({
  providers: [
    // Global services
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: APP_INITIALIZER, useFactory: appInitializerFactory, deps: [ConfigService], multi: true }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
```

### 2. Lazy Loading Strategy

```typescript
// App Routing Module
const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
    data: { preload: true }
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard],
    data: { preload: true }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: SelectivePreloadingStrategy,
    relativeLinkResolution: 'legacy'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

## Reactive Programming Strategy (RxJS + Signals)

### 1. When to Use RxJS vs Signals

```typescript
// decision-matrix.ts
/**
 * RxJS - Best for:
 * - HTTP requests and API calls
 * - WebSocket connections
 * - Complex async operations
 * - Event streams (keyboard, mouse, scroll)
 * - Debouncing/throttling
 * - Retry logic
 * - Cancellable operations
 *
 * Signals - Best for:
 * - Component state management
 * - Synchronous state updates
 * - Computed values
 * - UI reactivity
 * - Form state
 * - Simple counters/toggles
 */
```

### 2. Signal-Based State Management

```typescript
// Using Signals for Component State
@Component({
  selector: 'app-product-list',
  template: `
    <div class="filters">
      <input (input)="searchTerm.set($event.target.value)" placeholder="Search...">
      <select (change)="selectedCategory.set($event.target.value)">
        <option value="">All Categories</option>
        <option *ngFor="let cat of categories()" [value]="cat.id">{{cat.name}}</option>
      </select>
    </div>

    <div class="product-grid">
      <app-product-card
        *ngFor="let product of filteredProducts()"
        [product]="product"
        (addToCart)="addToCart($event)">
      </app-product-card>
    </div>

    <div class="cart-summary">
      Items: {{cartCount()}} | Total: {{cartTotal() | currency}}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  // Signals for state
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  searchTerm = signal('');
  selectedCategory = signal('');
  cart = signal<CartItem[]>([]);

  // Computed signals
  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const category = this.selectedCategory();

    return this.products().filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(term) ||
                          product.description.toLowerCase().includes(term);
      const matchesCategory = !category || product.categoryId === category;
      return matchesSearch && matchesCategory;
    });
  });

  cartCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  constructor(private productService: ProductService) {
    // Load initial data using RxJS
    this.loadProducts();
  }

  private loadProducts(): void {
    // RxJS for API calls
    forkJoin({
      products: this.productService.getProducts(),
      categories: this.productService.getCategories()
    }).pipe(
      takeUntilDestroyed()
    ).subscribe({
      next: ({ products, categories }) => {
        this.products.set(products);
        this.categories.set(categories);
      },
      error: (error) => console.error('Failed to load data:', error)
    });
  }

  addToCart(product: Product): void {
    this.cart.update(items => {
      const existing = items.find(item => item.productId === product.id);
      if (existing) {
        return items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });
  }
}
```

### 3. RxJS for API Operations & Side Effects

```typescript
// product.service.ts
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = '/api/products';

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  // Search with debouncing
  searchProducts(searchTerm$: Observable<string>): Observable<Product[]> {
    return searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term =>
        term ? this.search(term) : of([])
      ),
      retry(3),
      catchError(error => {
        this.logger.error('Search failed', error);
        return of([]);
      })
    );
  }

  // Polling for real-time updates
  getProductUpdates(productId: string): Observable<Product> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => this.getProduct(productId)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay(1)
    );
  }

  // Optimistic updates with rollback
  updateProduct(product: Product): Observable<Product> {
    const optimisticUpdate$ = new Subject<Product>();

    return merge(
      optimisticUpdate$,
      this.http.put<Product>(`${this.apiUrl}/${product.id}`, product).pipe(
        retry(3),
        catchError(error => {
          // Rollback on error
          this.logger.error('Update failed, rolling back', error);
          return throwError(() => error);
        })
      )
    ).pipe(
      tap(() => optimisticUpdate$.next(product)),
      take(2)
    );
  }

  // Batch operations
  batchDelete(ids: string[]): Observable<any> {
    return from(ids).pipe(
      mergeMap(id =>
        this.http.delete(`${this.apiUrl}/${id}`).pipe(
          catchError(() => of({ id, error: true }))
        ),
        3 // Concurrency limit
      ),
      toArray(),
      map(results => ({
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error)
      }))
    );
  }

  private search(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search`, {
      params: { q: term }
    });
  }

  private getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
}
```

### 4. Advanced Signal Patterns

```typescript
// Global State Store with Signals
@Injectable({
  providedIn: 'root'
})
export class AppStateStore {
  // User state
  private _user = signal<User | null>(null);
  private _isAuthenticated = computed(() => !!this._user());
  private _permissions = computed(() => this._user()?.permissions || []);

  // App settings
  private _theme = signal<'light' | 'dark'>('light');
  private _language = signal<string>('en');

  // Loading states
  private _loadingTasks = signal<Set<string>>(new Set());
  private _isLoading = computed(() => this._loadingTasks().size > 0);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated;
  readonly permissions = this._permissions;
  readonly theme = this._theme.asReadonly();
  readonly language = this._language.asReadonly();
  readonly isLoading = this._isLoading;

  // Computed helper methods
  hasPermission = (permission: string) =>
    computed(() => this._permissions().includes(permission));

  // State update methods
  setUser(user: User | null): void {
    this._user.set(user);
  }

  updateUserProfile(updates: Partial<User>): void {
    this._user.update(current =>
      current ? { ...current, ...updates } : null
    );
  }

  toggleTheme(): void {
    this._theme.update(current =>
      current === 'light' ? 'dark' : 'light'
    );
  }

  setLanguage(lang: string): void {
    this._language.set(lang);
  }

  // Loading state management
  startLoading(taskId: string): void {
    this._loadingTasks.update(tasks => {
      const newTasks = new Set(tasks);
      newTasks.add(taskId);
      return newTasks;
    });
  }

  stopLoading(taskId: string): void {
    this._loadingTasks.update(tasks => {
      const newTasks = new Set(tasks);
      newTasks.delete(taskId);
      return newTasks;
    });
  }
}
```

### 5. Hybrid Approach: Signals + RxJS

```typescript
// Form with mixed reactive approach
@Component({
  selector: 'app-user-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" placeholder="Email">
      <div *ngIf="emailError()" class="error">{{emailError()}}</div>

      <input formControlName="username" placeholder="Username">
      <div *ngIf="usernameStatus() === 'checking'" class="status">
        Checking availability...
      </div>
      <div *ngIf="usernameStatus() === 'taken'" class="error">
        Username already taken
      </div>

      <button [disabled]="!isFormValid() || isSubmitting()">
        {{isSubmitting() ? 'Saving...' : 'Save'}}
      </button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent implements OnInit {
  form: FormGroup;

  // Signals for UI state
  emailError = signal<string>('');
  usernameStatus = signal<'idle' | 'checking' | 'available' | 'taken'>('idle');
  isSubmitting = signal(false);

  // Computed signal for form validity
  isFormValid = computed(() =>
    this.form?.valid && this.usernameStatus() !== 'taken'
  );

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    // Email validation with signals
    this.form.get('email')!.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(() => {
      const emailControl = this.form.get('email')!;
      if (emailControl.errors?.['required']) {
        this.emailError.set('Email is required');
      } else if (emailControl.errors?.['email']) {
        this.emailError.set('Invalid email format');
      } else {
        this.emailError.set('');
      }
    });

    // Username availability check with RxJS
    this.form.get('username')!.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(username => username.length >= 3),
      tap(() => this.usernameStatus.set('checking')),
      switchMap(username =>
        this.userService.checkUsernameAvailability(username).pipe(
          catchError(() => of({ available: true }))
        )
      ),
      takeUntilDestroyed()
    ).subscribe(result => {
      this.usernameStatus.set(result.available ? 'available' : 'taken');
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isSubmitting.set(true);

    this.userService.saveUser(this.form.value).pipe(
      finalize(() => this.isSubmitting.set(false)),
      take(1)
    ).subscribe({
      next: (user) => {
        console.log('User saved:', user);
        // Navigate or show success
      },
      error: (error) => {
        console.error('Save failed:', error);
        // Show error message
      }
    });
  }
}
```

### 6. WebSocket with RxJS and Signal Updates

```typescript
// Real-time updates service
@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private socket$: WebSocketSubject<any>;

  // Signals for connection state
  private _isConnected = signal(false);
  private _reconnectAttempts = signal(0);

  readonly isConnected = this._isConnected.asReadonly();
  readonly reconnectAttempts = this._reconnectAttempts.asReadonly();

  constructor(
    private appState: AppStateStore,
    private logger: LoggerService
  ) {}

  connect(): Observable<any> {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.createWebSocket();
    }

    return this.socket$.asObservable().pipe(
      tap({
        next: () => {
          this._isConnected.set(true);
          this._reconnectAttempts.set(0);
        },
        error: () => {
          this._isConnected.set(false);
        },
        complete: () => {
          this._isConnected.set(false);
        }
      }),
      retryWhen(errors =>
        errors.pipe(
          tap(() => this._reconnectAttempts.update(n => n + 1)),
          delay(1000),
          take(5)
        )
      ),
      shareReplay(1)
    );
  }

  private createWebSocket(): WebSocketSubject<any> {
    return webSocket({
      url: 'wss://api.example.com/ws',
      openObserver: {
        next: () => this.logger.info('WebSocket connected')
      },
      closeObserver: {
        next: () => this.logger.info('WebSocket disconnected')
      }
    });
  }

  // Subscribe to specific events
  subscribeToNotifications(): Observable<Notification> {
    return this.connect().pipe(
      filter(msg => msg.type === 'notification'),
      map(msg => msg.payload)
    );
  }

  // Send message through WebSocket
  sendMessage(message: any): void {
    if (this.socket$ && this._isConnected()) {
      this.socket$.next(message);
    }
  }
}
```

  // Send message through WebSocket
  sendMessage(message: any): void {
    if (this.socket$ && this._isConnected()) {
      this.socket$.next(message);
    }
  }
}
```

### 7. Advanced RxJS Patterns for API Operations

```typescript
// api-base.service.ts
@Injectable({
  providedIn: 'root'
})
export class ApiBaseService {
  constructor(
    private http: HttpClient,
    private appState: AppStateStore,
    private logger: LoggerService
  ) {}

  // Generic request with loading states
  protected request<T>(
    method: string,
    url: string,
    options?: any,
    taskId?: string
  ): Observable<T> {
    const id = taskId || `api-${Date.now()}`;

    return of(null).pipe(
      tap(() => this.appState.startLoading(id)),
      switchMap(() => this.http.request<T>(method, url, options)),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          this.logger.warn(`Retry attempt ${retryCount} for ${url}`);
          return timer(Math.min(1000 * Math.pow(2, retryCount), 10000));
        }
      }),
      catchError(error => {
        this.logger.error(`Request failed: ${method} ${url}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.appState.stopLoading(id))
    );
  }

  // Paginated data fetching
  protected fetchPaginated<T>(
    urlFactory: (page: number) => string,
    pageSize: number = 20
  ): Observable<T[]> {
    return new Observable<T[]>(observer => {
      let page = 0;
      let hasMore = true;
      const allItems: T[] = [];

      const fetchNextPage = () => {
        if (!hasMore) {
          observer.next(allItems);
          observer.complete();
          return;
        }

        this.http.get<{ items: T[], hasMore: boolean }>(urlFactory(page))
          .subscribe({
            next: response => {
              allItems.push(...response.items);
              hasMore = response.hasMore;
              page++;

              // Emit progress
              observer.next([...allItems]);

              if (hasMore) {
                fetchNextPage();
              } else {
                observer.complete();
              }
            },
            error: error => observer.error(error)
          });
      };

      fetchNextPage();
    });
  }

  // Intelligent caching with refresh
  protected cachedRequest<T>(
    key: string,
    request$: Observable<T>,
    ttl: number = 300000 // 5 minutes
  ): Observable<T> {
    const cache$ = new BehaviorSubject<{ data: T; timestamp: number } | null>(null);

    return cache$.pipe(
      switchMap(cached => {
        const now = Date.now();
        if (cached && now - cached.timestamp < ttl) {
          return of(cached.data);
        }

        return request$.pipe(
          tap(data => cache$.next({ data, timestamp: now }))
        );
      })
    );
  }
}
```

### 8. Signal Effects and Side Effects Management

```typescript
// Signal effects for side effects
@Component({
  selector: 'app-dashboard',
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  // Signals for state
  selectedMetric = signal<Metric>('revenue');
  dateRange = signal<DateRange>({ start: new Date(), end: new Date() });
  chartData = signal<ChartData | null>(null);

  constructor(
    private analyticsService: AnalyticsService,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    // Effect to load data when inputs change
    effect(() => {
      const metric = this.selectedMetric();
      const range = this.dateRange();

      // This will re-run whenever selectedMetric or dateRange changes
      untracked(() => {
        this.loadChartData(metric, range);
      });
    }, { injector: this.injector });

    // Effect for local storage sync
    effect(() => {
      const metric = this.selectedMetric();
      localStorage.setItem('dashboardMetric', metric);
    }, { injector: this.injector });
  }

  private loadChartData(metric: Metric, range: DateRange): void {
    this.analyticsService.getChartData(metric, range)
      .pipe(take(1))
      .subscribe(data => this.chartData.set(data));
  }
}
```

### 9. Complex Form Handling with Signals and RxJS

```typescript
// Dynamic form with validation
@Injectable({
  providedIn: 'root'
})
export class DynamicFormService {
  // Form configuration as signals
  private _fields = signal<FormField[]>([]);
  private _values = signal<Record<string, any>>({});
  private _errors = signal<Record<string, string[]>>({});
  private _touched = signal<Set<string>>(new Set());

  // Public computed states
  fields = this._fields.asReadonly();
  values = this._values.asReadonly();
  errors = this._errors.asReadonly();
  isValid = computed(() => Object.keys(this._errors()).length === 0);

  // Field-specific computed values
  getFieldError = (fieldName: string) =>
    computed(() => {
      const touched = this._touched().has(fieldName);
      const errors = this._errors()[fieldName];
      return touched && errors ? errors[0] : null;
    });

  // RxJS for async validation
  private validationSubject = new Subject<{ field: string; value: any }>();

  constructor() {
    // Setup async validation pipeline
    this.validationSubject.pipe(
      groupBy(({ field }) => field),
      mergeMap(group$ =>
        group$.pipe(
          debounceTime(300),
          switchMap(({ field, value }) =>
            this.validateFieldAsync(field, value).pipe(
              map(errors => ({ field, errors })),
              catchError(() => of({ field, errors: ['Validation error'] }))
            )
          )
        )
      )
    ).subscribe(({ field, errors }) => {
      this._errors.update(current => {
        const newErrors = { ...current };
        if (errors.length > 0) {
          newErrors[field] = errors;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    });
  }

  setFieldValue(fieldName: string, value: any): void {
    this._values.update(current => ({ ...current, [fieldName]: value }));
    this._touched.update(current => {
      const newTouched = new Set(current);
      newTouched.add(fieldName);
      return newTouched;
    });

    // Trigger async validation
    const field = this._fields().find(f => f.name === fieldName);
    if (field?.asyncValidators) {
      this.validationSubject.next({ field: fieldName, value });
    }
  }

  private validateFieldAsync(fieldName: string, value: any): Observable<string[]> {
    const field = this._fields().find(f => f.name === fieldName);
    if (!field?.asyncValidators) return of([]);

    return from(field.asyncValidators).pipe(
      mergeMap(validator => validator(value)),
      toArray(),
      map(results => results.filter(Boolean) as string[])
    );
  }
}
```

### 10. State Synchronization Pattern

```typescript
// Sync local state with backend using RxJS and Signals
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  // Local state with signals
  private _items = signal<Item[]>([]);
  private _pendingChanges = signal<Change[]>([]);
  private _syncStatus = signal<'idle' | 'syncing' | 'error'>('idle');

  items = this._items.asReadonly();
  pendingChanges = this._pendingChanges.asReadonly();
  syncStatus = this._syncStatus.asReadonly();
  hasPendingChanges = computed(() => this._pendingChanges().length > 0);

  // Sync queue with RxJS
  private syncQueue$ = new Subject<Change>();
  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private logger: LoggerService
  ) {
    this.setupSyncPipeline();
    this.setupAutoSync();
  }

  private setupSyncPipeline(): void {
    this.syncQueue$.pipe(
      // Buffer changes
      bufferTime(1000),
      filter(changes => changes.length > 0),
      // Batch sync
      concatMap(changes => this.syncChanges(changes)),
      retry({
        count: 3,
        delay: (error, retryCount) => timer(1000 * Math.pow(2, retryCount))
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this._syncStatus.set('idle'),
      error: (error) => {
        this._syncStatus.set('error');
        this.logger.error('Sync failed', error);
      }
    });
  }

  private setupAutoSync(): void {
    // Auto-sync every 30 seconds if online
    interval(30000).pipe(
      filter(() => navigator.onLine && this.hasPendingChanges()),
      takeUntil(this.destroy$)
    ).subscribe(() => this.sync());
  }

  addItem(item: Item): void {
    // Optimistic update
    this._items.update(items => [...items, item]);

    // Queue for sync
    const change: Change = { type: 'add', item, timestamp: Date.now() };
    this._pendingChanges.update(changes => [...changes, change]);
    this.syncQueue$.next(change);
  }

  private syncChanges(changes: Change[]): Observable<any> {
    this._syncStatus.set('syncing');

    return this.api.batchSync(changes).pipe(
      tap(() => {
        // Remove synced changes
        this._pendingChanges.update(pending =>
          pending.filter(p => !changes.includes(p))
        );
      })
    );
  }

  sync(): void {
    const changes = this._pendingChanges();
    if (changes.length > 0) {
      changes.forEach(change => this.syncQueue$.next(change));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Performance Strategy

### 1. OnPush Change Detection

```typescript
@Component({
  selector: 'app-component',
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent { }
```

### 2. Virtual Scrolling for Lists

```typescript
// For large lists
<cdk-virtual-scroll-viewport itemSize="50" class="viewport">
  <div *cdkVirtualFor="let item of items">{{item}}</div>
</cdk-virtual-scroll-viewport>
```

### 3. Image Optimization

```typescript
@Directive({
  selector: 'img[appLazyLoad]'
})
export class LazyLoadImageDirective {
  @HostBinding('loading') loading = 'lazy';

  constructor(private renderer: Renderer2, private el: ElementRef) {
    // Implement Intersection Observer for older browsers
  }
}
```

### 4. Bundle Optimization

```json
// angular.json
{
  "optimization": {
    "scripts": true,
    "styles": {
      "minify": true,
      "inlineCritical": true
    },
    "fonts": {
      "inline": true
    }
  },
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    }
  ]
}
```

## PWA Implementation

### 1. Service Worker Configuration

```typescript
// ngsw-config.json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.json",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-performance",
      "urls": ["/api/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 100,
        "maxAge": "1h"
      }
    }
  ]
}
```

### 2. App Install Prompt

```typescript
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEvent: any;

  constructor() {
    window.addEventListener('beforeinstallprompt', event => {
      this.promptEvent = event;
    });
  }

  async promptInstall(): Promise<void> {
    if (this.promptEvent) {
      this.promptEvent.prompt();
      const result = await this.promptEvent.userChoice;
      this.promptEvent = null;
    }
  }
}
```

## Internationalization

### 1. i18n Configuration

```typescript
// app.module.ts
import { registerLocaleData } from '@angular/common';
import localeHi from '@angular/common/locales/hi';
import localeTa from '@angular/common/locales/ta';
import localeTe from '@angular/common/locales/te';

registerLocaleData(localeHi);
registerLocaleData(localeTa);
registerLocaleData(localeTe);

@NgModule({
  providers: [
    { provide: LOCALE_ID, useFactory: () => navigator.language }
  ]
})
```

### 2. Translation Service

```typescript
@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = new Map<string, any>();

  async loadTranslations(locale: string): Promise<void> {
    const translations = await import(`../assets/i18n/${locale}.json`);
    this.translations.set(locale, translations.default);
  }

  translate(key: string, params?: any): string {
    // Implementation
  }
}
```

## Mobile-First Responsive Design

### 1. Breakpoint System

```scss
// _breakpoints.scss
$breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
);

// Mobile-first mixins
@mixin respond-above($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    $breakpoint-value: map-get($breakpoints, $breakpoint);
    @media (min-width: $breakpoint-value) {
      @content;
    }
  }
}

@mixin respond-between($lower, $upper) {
  @if map-has-key($breakpoints, $lower) and map-has-key($breakpoints, $upper) {
    $lower-breakpoint: map-get($breakpoints, $lower);
    $upper-breakpoint: map-get($breakpoints, $upper);
    @media (min-width: $lower-breakpoint) and (max-width: ($upper-breakpoint - 1)) {
      @content;
    }
  }
}
```

### 2. Touch-Optimized Components

```typescript
@Directive({
  selector: '[appTouchOptimized]'
})
export class TouchOptimizedDirective {
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    // Add visual feedback
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    // Remove visual feedback
  }
}
```

## UI Component Library

### 1. Base Button Component

```typescript
@Component({
  selector: 'app-button',
  template: `
    <button
      [class]="classes"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      (click)="onClick.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() ariaLabel?: string;
  @Output() onClick = new EventEmitter<Event>();

  get classes(): string {
    return `btn btn--${this.variant} btn--${this.size}`;
  }
}
```

### 2. Component Documentation

```typescript
/**
 * @example
 * <app-button variant="primary" size="lg" (onClick)="handleClick()">
 *   Click me
 * </app-button>
 */
```

## Theming System

### 1. Angular Material Custom Theme

```scss
// _material-theme.scss
@use '@angular/material' as mat;
@include mat.core();

// Define custom palette
$primary-palette: (
  50: #e8f5e9,
  100: #c8e6c9,
  200: #a5d6a7,
  300: #81c784,
  400: #66bb6a,
  500: #4caf50,
  600: #43a047,
  700: #388e3c,
  800: #2e7d32,
  900: #1b5e20,
  A100: #b9f6ca,
  A200: #69f0ae,
  A400: #00e676,
  A700: #00c853,
  contrast: (
    50: rgba(black, 0.87),
    100: rgba(black, 0.87),
    200: rgba(black, 0.87),
    300: rgba(black, 0.87),
    400: rgba(black, 0.87),
    500: white,
    600: white,
    700: white,
    800: white,
    900: white,
    A100: rgba(black, 0.87),
    A200: rgba(black, 0.87),
    A400: rgba(black, 0.87),
    A700: rgba(black, 0.87)
  )
);

$app-primary: mat.define-palette($primary-palette, 500, 100, 900);
$app-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$app-warn: mat.define-palette(mat.$red-palette);

// Light theme
$app-light-theme: mat.define-light-theme((
  color: (
    primary: $app-primary,
    accent: $app-accent,
    warn: $app-warn
  ),
  typography: mat.define-typography-config(
    $font-family: 'Roboto, "Helvetica Neue", sans-serif'
  ),
  density: 0
));

// Dark theme
$app-dark-theme: mat.define-dark-theme((
  color: (
    primary: $app-primary,
    accent: $app-accent,
    warn: $app-warn
  )
));

// Apply theme
@include mat.all-component-themes($app-light-theme);

// Dark theme class
.dark-theme {
  @include mat.all-component-colors($app-dark-theme);
}
```

### 2. CSS Custom Properties

```scss
// _variables.scss
:root {
  // Colors
  --color-primary: #4caf50;
  --color-primary-light: #81c784;
  --color-primary-dark: #388e3c;
  --color-secondary: #ff4081;
  --color-background: #fafafa;
  --color-surface: #ffffff;
  --color-error: #f44336;
  --color-warning: #ff9800;
  --color-info: #2196f3;
  --color-success: #4caf50;

  // Typography
  --font-family-base: 'Roboto', sans-serif;
  --font-family-heading: 'Roboto', sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.5;

  // Spacing
  --spacing-unit: 0.25rem;
  --spacing-xs: calc(var(--spacing-unit) * 2);
  --spacing-sm: calc(var(--spacing-unit) * 3);
  --spacing-md: calc(var(--spacing-unit) * 4);
  --spacing-lg: calc(var(--spacing-unit) * 6);
  --spacing-xl: calc(var(--spacing-unit) * 8);

  // Borders
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 1rem;

  // Shadows
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.19);

  // Transitions
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}
```

## SCSS Architecture

### 1. Utility Classes

```scss
// _utilities.scss
// Spacing utilities
@each $prop, $abbrev in (margin: m, padding: p) {
  @each $size, $value in (0: 0, 1: 0.25rem, 2: 0.5rem, 3: 1rem, 4: 1.5rem, 5: 3rem) {
    .#{$abbrev}-#{$size} { #{$prop}: $value !important; }
    .#{$abbrev}t-#{$size} { #{$prop}-top: $value !important; }
    .#{$abbrev}r-#{$size} { #{$prop}-right: $value !important; }
    .#{$abbrev}b-#{$size} { #{$prop}-bottom: $value !important; }
    .#{$abbrev}l-#{$size} { #{$prop}-left: $value !important; }
    .#{$abbrev}x-#{$size} {
      #{$prop}-left: $value !important;
      #{$prop}-right: $value !important;
    }
    .#{$abbrev}y-#{$size} {
      #{$prop}-top: $value !important;
      #{$prop}-bottom: $value !important;
    }
  }
}

// Display utilities
.d-none { display: none !important; }
.d-block { display: block !important; }
.d-flex { display: flex !important; }
.d-grid { display: grid !important; }

// Responsive utilities
@each $breakpoint, $value in $breakpoints {
  @if $breakpoint != xs {
    @include respond-above($breakpoint) {
      .d-#{$breakpoint}-none { display: none !important; }
      .d-#{$breakpoint}-block { display: block !important; }
      .d-#{$breakpoint}-flex { display: flex !important; }
      .d-#{$breakpoint}-grid { display: grid !important; }
    }
  }
}
```

### 2. Component Mixins

```scss
// _mixins.scss
@mixin button-variant($bg-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;
  border: none;

  &:hover:not(:disabled) {
    background-color: darken($bg-color, 10%);
  }

  &:active:not(:disabled) {
    background-color: darken($bg-color, 15%);
  }

  &:focus {
    box-shadow: 0 0 0 3px rgba($bg-color, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@mixin card-elevation($level: 1) {
  @if $level == 1 {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  } @else if $level == 2 {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  } @else if $level == 3 {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.14);
  }

  transition: box-shadow var(--transition-base);

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
}

@mixin truncate-text($lines: 1) {
  overflow: hidden;
  text-overflow: ellipsis;

  @if $lines == 1 {
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
  }
}

## Security Implementation

### 1. Content Security Policy

```typescript
// security.service.ts
@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  setCSPHeaders(): void {
    const csp = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://api.yourdomain.com']
    };

    const cspString = Object.entries(csp)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');

    // Set via meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspString;
    document.head.appendChild(meta);
  }
}
```

### 2. Authentication Interceptor

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.auth.logout();
          this.router.navigate(['/auth/login']);
        }
        return throwError(error);
      })
    );
  }
}
```

### 3. Input Sanitization

```typescript
@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, value) || '';
  }
}
```

### 4. HTTPS Enforcement

```typescript
// app.component.ts
export class AppComponent implements OnInit {
  ngOnInit(): void {
    if (location.protocol !== 'https:' && environment.production) {
      location.replace('https:' + window.location.href.substring(window.location.protocol.length));
    }
  }
}
```

## Testing Strategy

### 1. Unit Testing Setup

```typescript
// karma.conf.js
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: false
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/app'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ],
      check: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      }
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    singleRun: false,
    restartOnFileChange: true
  });
};
```

### 2. Component Unit Test Example

```typescript
// button.component.spec.ts
describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit click event', () => {
    spyOn(component.onClick, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(component.onClick.emit).toHaveBeenCalled();
  });

  it('should apply correct CSS classes', () => {
    component.variant = 'primary';
    component.size = 'lg';
    expect(component.classes).toBe('btn btn--primary btn--lg');
  });

  it('should be disabled when disabled input is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTruthy();
  });
});
```

### 3. Service Unit Test Example

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should authenticate user', () => {
    const mockResponse = { token: 'test-token', user: { id: 1, name: 'Test' } };

    service.login('test@example.com', 'password').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password' });
    req.flush(mockResponse);
  });
});
```

### 4. Integration Testing with Cypress

```typescript
// cypress/integration/auth.spec.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should login successfully', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'test-token', user: { id: 1, name: 'Test User' } }
    }).as('login');

    cy.get('[data-cy=login-email]').type('test@example.com');
    cy.get('[data-cy=login-password]').type('password');
    cy.get('[data-cy=login-submit]').click();

    cy.wait('@login');
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=user-name]').should('contain', 'Test User');
  });

  it('should handle login error', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('loginError');

    cy.get('[data-cy=login-email]').type('wrong@example.com');
    cy.get('[data-cy=login-password]').type('wrongpassword');
    cy.get('[data-cy=login-submit]').click();

    cy.wait('@loginError');
    cy.get('[data-cy=error-message]').should('contain', 'Invalid credentials');
  });
});
```

### 5. E2E Testing Configuration

```json
// cypress.json
{
  "baseUrl": "http://localhost:4200",
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "video": false,
  "screenshotOnRunFailure": true,
  "defaultCommandTimeout": 10000,
  "requestTimeout": 10000,
  "responseTimeout": 10000,
  "env": {
    "apiUrl": "http://localhost:3000/api"
  }
}
```

## Production Monitoring & Tools

### 1. Application Performance Monitoring (APM)

#### New Relic Setup

```typescript
// main.ts
import { enableProdMode } from '@angular/core';

if (environment.production) {
  enableProdMode();

  // Initialize New Relic
  if (window['newrelic']) {
    window['newrelic'].setPageViewName('Angular App');
    window['newrelic'].setCustomAttribute('version', environment.version);
  }
}
```

```html
<!-- index.html -->
<script type="text/javascript">
  // New Relic Browser Agent
  ;(function(a,b,c,d,e,f,g,h){a.NREUM||(a.NREUM={});...
</script>
```

#### Alternative: Datadog RUM

```typescript
// datadog-rum.service.ts
import { datadogRum } from '@datadog/browser-rum';

@Injectable({
  providedIn: 'root'
})
export class DatadogRumService {
  init(): void {
    datadogRum.init({
      applicationId: 'YOUR_APPLICATION_ID',
      clientToken: 'YOUR_CLIENT_TOKEN',
      site: 'datadoghq.com',
      service: 'your-angular-app',
      env: environment.production ? 'prod' : 'dev',
      version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input'
    });

    datadogRum.startSessionReplayRecording();
  }
}
```

### 2. Error Tracking

#### Sentry Configuration

```typescript
// app.module.ts
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: environment.production ? "production" : "development",
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ["localhost", "https://yourserver.com/api"],
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],
  tracesSampleRate: environment.production ? 0.1 : 1.0,
});

@NgModule({
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
})
export class AppModule {}
```

### 3. Analytics

#### Google Analytics 4

```typescript
// analytics.service.ts
declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    if (isPlatformBrowser(this.platformId)) {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url
      });

      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        gtag('event', 'page_view', {
          page_path: event.urlAfterRedirects
        });
      });
    }
  }

  trackEvent(eventName: string, parameters?: any): void {
    gtag('event', eventName, parameters);
  }
}
```

### 4. Performance Monitoring

#### Web Vitals Tracking

```typescript
// web-vitals.service.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

@Injectable({
  providedIn: 'root'
})
export class WebVitalsService {
  init(): void {
    this.trackWebVitals();
  }

  private trackWebVitals(): void {
    getCLS(this.sendToAnalytics);
    getFID(this.sendToAnalytics);
    getFCP(this.sendToAnalytics);
    getLCP(this.sendToAnalytics);
    getTTFB(this.sendToAnalytics);
  }

  private sendToAnalytics(metric: any): void {
    // Send to your analytics service
    if (window['newrelic']) {
      window['newrelic'].addPageAction('web-vitals', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating
      });
    }

    // Also send to GA4
    gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }
}
```

### 5. Logging Service

```typescript
// logger.service.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  private logBuffer: any[] = [];
  private maxBufferSize = 100;

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, args, error);
  }

  private log(level: LogLevel, message: string, args: any[], error?: Error): void {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: LogLevel[level],
      message,
      args,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    };

    // Console output
    if (!environment.production) {
      console.log(`[${timestamp}] ${LogLevel[level]}: ${message}`, ...args);
      if (error) console.error(error);
    }

    // Buffer logs
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Send to remote logging service
    if (level >= LogLevel.WARN && environment.production) {
      this.sendToRemote(logEntry);
    }
  }

  private sendToRemote(logEntry: any): void {
    // Send to LogRocket, Loggly, or custom endpoint
    if (window['LogRocket']) {
      window['LogRocket'].captureMessage(logEntry.message, {
        level: logEntry.level.toLowerCase(),
        extra: logEntry
      });
    }
  }

  getLogBuffer(): any[] {
    return [...this.logBuffer];
  }
}
```

## Monitoring Tools Comparison

| Tool | Purpose | Key Features | Pricing |
|------|---------|--------------|---------|
| **New Relic** | Full-stack APM | Browser monitoring, distributed tracing, alerting | Free tier + usage-based |
| **Datadog** | Observability platform | RUM, APM, logs, infrastructure | Pay-per-host |
| **Sentry** | Error tracking | Real-time error alerts, release tracking | Free tier + event-based |
| **LogRocket** | Session replay | User session recording, Redux logging | Session-based |
| **Google Analytics** | User analytics | User behavior, conversions, demographics | Free (GA4) |
| **Hotjar** | User insights | Heatmaps, session recordings, surveys | Free tier + pageview-based |

### Recommended Stack for Production

1. **APM & Performance**: New Relic or Datadog
2. **Error Tracking**: Sentry
3. **User Analytics**: Google Analytics 4
4. **Session Replay**: LogRocket or Hotjar
5. **Synthetic Monitoring**: Pingdom or UptimeRobot
6. **Log Aggregation**: ELK Stack or Datadog Logs

## Build Configuration

### 1. Production Build Optimization

```json
// angular.json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true,
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        },
        {
          "type": "anyComponentStyle",
          "maximumWarning": "2kb",
          "maximumError": "4kb"
        }
      ],
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }
      ],
      "serviceWorker": true,
      "ngswConfigPath": "ngsw-config.json"
    }
  }
}
```

### 2. Environment Configuration

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  version: require('../../package.json').version,
  sentryDsn: 'YOUR_SENTRY_DSN',
  gaTrackingId: 'GA_MEASUREMENT_ID',
  newRelicAppId: 'YOUR_NEW_RELIC_APP_ID'
};
```

## Development Workflow

### 1. Git Hooks with Husky

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test:ci",
      "pre-push": "npm run build:prod"
    }
  },
  "scripts": {
    "lint": "ng lint",
    "test": "ng test",
    "test:ci": "ng test --no-watch --no-progress --browsers=ChromeHeadless",
    "test:coverage": "ng test --no-watch --code-coverage",
    "e2e": "ng e2e",
    "e2e:ci": "ng e2e --headless",
    "build:prod": "ng build --prod",
    "analyze": "ng build --prod --stats-json && webpack-bundle-analyzer dist/stats.json"
  }
}
```

### 2. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Lint
      run: npm run lint

    - name: Unit tests
      run: npm run test:ci

    - name: E2E tests
      run: npm run e2e:ci

    - name: Build
      run: npm run build:prod

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

    - name: Deploy to staging
      if: github.ref == 'refs/heads/develop'
      run: |
        # Deploy to staging environment

    - name: Deploy to production
      if: github.ref == 'refs/heads/main'
      run: |
        # Deploy to production environment
```

## Summary

This architecture blueprint provides:

1. **Performance**: OnPush change detection, lazy loading, virtual scrolling, PWA
2. **Reactive Programming**:
   - RxJS for API calls, WebSockets, complex async operations, and side effects
   - Angular Signals for component state, computed values, and UI reactivity
   - Hybrid patterns combining both for optimal performance
3. **Mobile-First**: Responsive mixins, touch optimization, PWA installation
4. **Internationalization**: Full i18n support for Indian languages
5. **Reusable Components**: Centralized UI library with consistent theming
6. **Testing**: Comprehensive unit and integration test coverage
7. **Monitoring**: Production-ready monitoring stack with New Relic, Sentry, etc.
8. **Security**: CSP, authentication, input sanitization, HTTPS enforcement
9. **Developer Experience**:
   - Consistent SCSS architecture with mixins and utilities
   - Automated workflows with Git hooks and CI/CD
   - Clear patterns for when to use RxJS vs Signals

**Key Reactive Programming Guidelines:**
- **Use RxJS for**: HTTP requests, WebSocket connections, event streams, debouncing/throttling, retry logic, complex async operations
- **Use Signals for**: Component state, form state, computed values, UI reactivity, synchronous updates
- **Combine both**: Use RxJS for data fetching and Signals for storing the fetched data

The architecture is designed to be scalable, maintainable, and optimized for mobile PWA usage while supporting desktop and tablet experiences, with a strong emphasis on reactive programming patterns that maximize performance and developer productivity.