// Core type definitions for بديل الجرد (Inventory Management System)

export type Role = 'admin' | 'manager' | 'user';

export type Permission =
  | 'view_dashboard'
  | 'view_inventory'
  | 'create_item'
  | 'edit_item'
  | 'delete_item'
  | 'view_movement'
  | 'record_movement'
  | 'edit_quantity'
  | 'view_history'
  | 'view_warehouses'
  | 'create_warehouse'
  | 'edit_warehouse'
  | 'delete_warehouse'
  | 'view_users'
  | 'create_user'
  | 'edit_user'
  | 'delete_user'
  | 'view_permissions'
  | 'edit_permissions'
  | 'import_data'
  | 'export_data';

export interface User {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  role: Role;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Item {
  id: string;
  name: string;
  barcode?: string;
  warehouseId: string;
  quantity: number;
  minQuantity?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type MovementType = 'in' | 'out' | 'adjustment';

export interface HistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  username: string;
  timestamp: string;
  notes?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface WarehouseContextType {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  setSelectedWarehouse: (warehouse: Warehouse | null) => void;
  createWarehouse: (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<Warehouse>;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  refreshWarehouses: () => Promise<void>;
}

export interface InventoryContextType {
  items: Item[];
  history: HistoryEntry[];
  loading: boolean;
  createItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  recordMovement: (itemId: string, type: MovementType, quantity: number, notes?: string) => Promise<void>;
  recordBatchMovements: (movements: Array<{ itemId: string; quantity: number }>, type: MovementType, notes?: string) => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export interface DashboardStats {
  totalItems: number;
  totalQuantity: number;
  movementsToday: number;
  lowStockItems: number;
}
