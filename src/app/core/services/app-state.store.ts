import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models/user.model';

// Global State Store using Angular Signals
// Use this for application-wide state management
@Injectable({
  providedIn: 'root',
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
  hasPermission = (permission: string) => computed(() => this._permissions().includes(permission));

  // State update methods
  setUser(user: User | null): void {
    this._user.set(user);
  }

  updateUserProfile(updates: Partial<User>): void {
    this._user.update(current => (current ? { ...current, ...updates } : null));
  }

  toggleTheme(): void {
    this._theme.update(current => (current === 'light' ? 'dark' : 'light'));
    // Apply theme class to document
    if (this._theme() === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  setTheme(theme: 'light' | 'dark'): void {
    this._theme.set(theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
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

  // Reset all state (useful for logout)
  reset(): void {
    this._user.set(null);
    this._loadingTasks.set(new Set());
  }
}
