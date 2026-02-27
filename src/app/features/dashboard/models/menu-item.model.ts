export interface MenuItem {
  id: string;
  label: string;
  value: string;
  children?: MenuItem[];
  icon?: string;
  url?: string;
  route?: string;
  inputType?: 'text' | 'number' | 'email' | 'bank' | 'ip' | 'imei';
  validations?: string[];
  historySearchType?: string;
  searchType?: string;
}

export interface NavbarSelection {
  parent?: MenuItem;
  child?: MenuItem;
  fullPath: string;
}
