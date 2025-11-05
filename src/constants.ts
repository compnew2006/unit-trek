import { Permission, Role } from './types';

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_inventory',
    'create_item',
    'edit_item',
    'delete_item',
    'view_movement',
    'record_movement',
    'edit_quantity',
    'view_history',
    'view_warehouses',
    'create_warehouse',
    'edit_warehouse',
    'delete_warehouse',
    'view_users',
    'create_user',
    'edit_user',
    'delete_user',
    'view_permissions',
    'edit_permissions',
    'import_data',
    'export_data',
  ],
  manager: [
    'view_dashboard',
    'view_inventory',
    'create_item',
    'edit_item',
    'view_movement',
    'record_movement',
    'edit_quantity',
    'view_history',
    'view_warehouses',
    'view_users',
    'import_data',
    'export_data',
  ],
  user: [
    'view_dashboard',
    'view_inventory',
    'view_movement',
    'record_movement',
    'view_history',
  ],
};

export const STORAGE_KEYS = {
  USERS: 'db_users',
  WAREHOUSES: 'db_warehouses',
  ITEMS: 'db_items',
  HISTORY: 'db_history',
  PERMISSIONS: 'db_permissions',
  AUTH_TOKEN: 'auth_token',
  SETUP_COMPLETE: 'setup_complete',
  SELECTED_WAREHOUSE: 'selected_warehouse',
  THEME: 'theme',
  LOCALE: 'locale',
} as const;

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  USERS: '/api/users',
  WAREHOUSES: '/api/warehouses',
  ITEMS: '/api/items',
  HISTORY: '/api/history',
  PERMISSIONS: '/api/permissions',
  MOVEMENTS: '/api/movements',
} as const;
