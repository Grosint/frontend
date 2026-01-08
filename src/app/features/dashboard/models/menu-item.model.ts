export interface MenuItem {
  id: string;
  label: string;
  value: string;
  children?: MenuItem[];
  icon?: string;
  url?: string;
}

export interface NavbarSelection {
  parent?: MenuItem;
  child?: MenuItem;
  fullPath: string;
}
