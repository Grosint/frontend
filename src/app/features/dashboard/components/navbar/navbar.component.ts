import {
  Component,
  Output,
  Input,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { MenuItem, NavbarSelection } from '../../models/menu-item.model';
import menuItemsData from '../../../../../assets/data/menu-items.json';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  @Output() selectionChange = new EventEmitter<NavbarSelection>();
  @Output() toggleNavbar = new EventEmitter<void>();
  @Input() collapsed = false;

  menuItems: MenuItem[] = menuItemsData as MenuItem[];
  selectedParent: MenuItem | null = null;
  selectedChild: MenuItem | null = null;
  expandedItems: Set<string> = new Set();
  isLoading = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const defaultParent =
      this.menuItems.find(item => item.id === 'osint-search') ||
      this.menuItems.find(item => item.value === 'osint-search');
    const defaultChild =
      defaultParent?.children?.find(item => item.id === 'osint-search-mobile') ||
      defaultParent?.children?.find(item => item.value === 'mobile');

    if (defaultParent) {
      this.selectedParent = defaultParent;
      this.expandedItems.add(defaultParent.id);
      if (defaultChild) {
        this.selectedChild = defaultChild;
        this.emitSelection(defaultParent, defaultChild);
      } else if (!defaultParent.children?.length) {
        this.emitSelection(defaultParent, null);
      }
      this.cdr.markForCheck();
    }
  }

  onToggleNavbar(): void {
    this.toggleNavbar.emit();
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
