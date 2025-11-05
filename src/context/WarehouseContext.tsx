import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Warehouse, WarehouseContextType } from '../types';
import { api, apiEvents } from '../services/apiService';
import { STORAGE_KEYS } from '../constants';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';
import { useLocale } from '../hooks/useLocale';

export const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouseState] = useState<Warehouse | null>(null);
  const { user } = useAuth();
  const { t } = useLocale();

  const loadWarehouses = useCallback(async () => {
    try {
      const data = await api.warehouses.getAll();
      setWarehouses(data);

      // Restore selected warehouse from localStorage
      const savedId = localStorage.getItem(STORAGE_KEYS.SELECTED_WAREHOUSE);
      if (savedId) {
        const saved = data.find(w => w.id === savedId);
        if (saved) {
          setSelectedWarehouseState(saved);
        } else if (data.length > 0) {
          setSelectedWarehouseState(data[0]);
        }
      } else if (data.length > 0) {
        setSelectedWarehouseState(data[0]);
      }
    } catch (error) {
      logger.error('Failed to load warehouses', error instanceof Error ? error : new Error(String(error)));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadWarehouses();
    }
  }, [user, loadWarehouses]);

  useEffect(() => {
    const handleDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.key === STORAGE_KEYS.WAREHOUSES || customEvent.detail.key === 'WAREHOUSES') {
        loadWarehouses();
      }
    };

    apiEvents.addEventListener('dataUpdated', handleDataUpdate);
    return () => apiEvents.removeEventListener('dataUpdated', handleDataUpdate);
  }, [loadWarehouses]);

  const setSelectedWarehouse = (warehouse: Warehouse | null) => {
    setSelectedWarehouseState(warehouse);
    if (warehouse) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_WAREHOUSE, warehouse.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_WAREHOUSE);
    }
  };

  const createWarehouse = async (data: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const newWarehouse = await api.warehouses.create(data, user.id);
      toast.success(t('warehouses.warehouseCreated') || 'Warehouse created successfully');
      await loadWarehouses();
      return newWarehouse;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (t('warehouses.createWarehouseError') || 'Failed to create warehouse');
      logger.error('Failed to create warehouse', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      await api.warehouses.update(id, updates);
      toast.success(t('warehouses.warehouseUpdated') || 'Warehouse updated successfully');
      await loadWarehouses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (t('warehouses.updateWarehouseError') || 'Failed to update warehouse');
      logger.error('Failed to update warehouse', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  const deleteWarehouse = async (id: string) => {
    try {
      await api.warehouses.delete(id);
      toast.success(t('warehouses.warehouseDeleted') || 'Warehouse deleted successfully');
      if (selectedWarehouse?.id === id) {
        setSelectedWarehouse(null);
      }
      await loadWarehouses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (t('warehouses.deleteWarehouseError') || 'Failed to delete warehouse');
      logger.error('Failed to delete warehouse', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouse,
        setSelectedWarehouse,
        createWarehouse,
        updateWarehouse,
        deleteWarehouse,
        refreshWarehouses: loadWarehouses,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};
