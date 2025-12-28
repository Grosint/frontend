import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MenuItem, NavbarSelection } from '../../models/menu-item.model';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  @Output() selectionChange = new EventEmitter<NavbarSelection>();

  menuItems: MenuItem[] = [];
  selectedParent: MenuItem | null = null;
  selectedChild: MenuItem | null = null;
  expandedItems: Set<string> = new Set();
  isLoading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMenuItems();
  }

  private loadMenuItems(): void {
    this.http.get<MenuItem[]>('assets/data/menu-items.json').subscribe({
      next: items => {
        this.menuItems = items;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to load menu items:', error);
        this.menuItems = this.getDefaultMenuItems();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private getDefaultMenuItems(): MenuItem[] {
    return [
      {
        id: 'osint-search',
        label: 'OSInt Search',
        value: 'osint-search',
        icon: 'fas fa-search',
      },
      {
        id: 'ip-search',
        label: 'IP Search',
        value: 'ip-search',
        icon: 'fas fa-network-wired',
      },
    ];
  }

  toggleExpand(item: MenuItem): void {
    if (item.children && item.children.length > 0) {
      if (this.expandedItems.has(item.id)) {
        this.expandedItems.delete(item.id);
      } else {
        this.expandedItems.add(item.id);
      }
      this.cdr.markForCheck();
    }
  }

  isExpanded(item: MenuItem): boolean {
    return this.expandedItems.has(item.id);
  }

  selectParent(item: MenuItem): void {
    if (item.children && item.children.length > 0) {
      this.toggleExpand(item);
      this.selectedParent = item;
      this.selectedChild = null;
    } else {
      // No children, select directly
      this.selectedParent = item;
      this.selectedChild = null;
      this.emitSelection(item, null);
    }
  }

  selectChild(parent: MenuItem, child: MenuItem, event: Event): void {
    event.stopPropagation();
    this.selectedParent = parent;
    this.selectedChild = child;
    this.emitSelection(parent, child);
  }

  isParentSelected(item: MenuItem): boolean {
    return this.selectedParent?.id === item.id;
  }

  isChildSelected(child: MenuItem): boolean {
    return this.selectedChild?.id === child.id;
  }

  private emitSelection(parent: MenuItem | null, child: MenuItem | null): void {
    const selection: NavbarSelection = {
      parent: parent || undefined,
      child: child || undefined,
      fullPath: child ? `${parent?.value}/${child.value}` : parent?.value || '',
    };

    this.selectionChange.emit(selection);
  }
}
