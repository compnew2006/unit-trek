// API service layer - abstraction over backend API
import * as apiClient from './apiClient';
import { ApiError } from './apiClient';
import { User, Warehouse, Item, HistoryEntry, Permission, Role, MovementType } from '../types';
import { DEFAULT_PERMISSIONS } from '../constants';
import { logger } from '../utils/logger';

// Event emitter for real-time updates (using polling or websockets)
export const apiEvents = new EventTarget() as EventTarget & {
  emit: (key: string) => void;
};

// Helper to trigger data update events
const triggerUpdate = (key: string) => {
  apiEvents.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key } }));
};

// Helper method to emit events (for backward compatibility)
apiEvents.emit = (key: string) => {
  triggerUpdate(key);
};

export const api = {
  auth: {
    // Auth is handled by AuthProvider - these methods are deprecated
    login: async () => {
      throw new Error('Use AuthProvider.signIn instead');
    },
    logout: async () => {
      throw new Error('Use AuthProvider.signOut instead');
    },
    getCurrentUser: () => {
      throw new Error('Use AuthProvider.user instead');
    },
  },
  
  users: {
    getAll: apiClient.usersApi.getAll,
    create: async () => {
      throw new Error('User creation must be done through the signup process');
    },
    update: async (id: string, updates: Partial<User>) => {
      const data = await apiClient.usersApi.update(id, updates);
      return data;
    },
    delete: async (id: string) => {
      await apiClient.usersApi.delete(id);
    },
  },
  
  warehouses: {
    getAll: async () => {
      const data = await apiClient.warehousesApi.getAll();
      return data;
    },
    create: async (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
      const data = await apiClient.warehousesApi.create(warehouse);
      triggerUpdate('WAREHOUSES');
      return data;
    },
    update: async (id: string, warehouse: Partial<Warehouse>) => {
      const data = await apiClient.warehousesApi.update(id, warehouse);
      triggerUpdate('WAREHOUSES');
      return data;
    },
    delete: async (id: string) => {
      await apiClient.warehousesApi.delete(id);
      triggerUpdate('WAREHOUSES');
    },
  },
  
  items: {
    getAll: async () => {
      const data = await apiClient.itemsApi.getAll();
      return data;
    },
    getByWarehouse: async (warehouseId: string) => {
      const data = await apiClient.itemsApi.getByWarehouse(warehouseId);
      return data;
    },
    create: async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
      const data = await apiClient.itemsApi.create(item);
      triggerUpdate('ITEMS');
      return data;
    },
    update: async (id: string, item: Partial<Item>) => {
      const data = await apiClient.itemsApi.update(id, item);
      triggerUpdate('ITEMS');
      return data;
    },
    delete: async (id: string) => {
      await apiClient.itemsApi.delete(id);
      triggerUpdate('ITEMS');
    },
    bulkCreate: async (items: Array<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>) => {
      const data = await apiClient.itemsApi.bulkCreate(items);
      triggerUpdate('ITEMS');
      return data;
    },
  },
  
  movements: {
    record: async (itemId: string, type: MovementType, quantity: number, userId: string, notes?: string) => {
      await apiClient.movementsApi.record(itemId, type, quantity, notes);
      triggerUpdate('ITEMS');
      triggerUpdate('HISTORY');
    },
    recordBatch: async (movements: Array<{ itemId: string; quantity: number }>, type: MovementType, notes?: string) => {
      // Process batch movements sequentially
      for (const movement of movements) {
        await apiClient.movementsApi.record(movement.itemId, type, movement.quantity, notes);
      }
      triggerUpdate('ITEMS');
      triggerUpdate('HISTORY');
    },
  },
  
  history: {
    getAll: async () => {
      const data = await apiClient.historyApi.getAll();
      return data;
    },
    getByWarehouse: async (warehouseId: string) => {
      const data = await apiClient.historyApi.getByWarehouse(warehouseId);
      return data;
    },
    getByItem: async (itemId: string) => {
      const data = await apiClient.historyApi.getByItem(itemId);
      return data;
    },
  },
  
  permissions: {
    getAll: async () => {
      return DEFAULT_PERMISSIONS;
    },
    update: async (role: Role, permissions: Permission[]) => {
      // Permissions are stored in constants, not persisted to database
      // This is a no-op for now, but could be extended to store in local storage or backend
      logger.warn('Permission updates are not persisted. Permissions are defined in constants.');
    },
    reset: async () => {
      // Permissions reset to defaults (defined in constants)
      logger.warn('Permission reset is not applicable. Permissions are defined in constants.');
    },
  },
};
