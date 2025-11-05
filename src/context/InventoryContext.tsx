import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Item, HistoryEntry, InventoryContextType, MovementType } from '../types';
import { api, apiEvents } from '../services/apiService';
import { STORAGE_KEYS } from '../constants';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useWarehouse } from '../hooks/useWarehouse';
import { logger } from '../utils/logger';
import { useLocale } from '../hooks/useLocale';

export const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { selectedWarehouse } = useWarehouse();
  const { t } = useLocale();

  const loadInventory = useCallback(async () => {
    if (!selectedWarehouse) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const data = await api.items.getByWarehouse(selectedWarehouse.id);
      setItems(data);
    } catch (error) {
      logger.error('Failed to load inventory', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  const loadHistory = useCallback(async () => {
    if (!selectedWarehouse) {
      setHistory([]);
      return;
    }

    try {
      const data = await api.history.getByWarehouse(selectedWarehouse.id);
      setHistory(data);
    } catch (error) {
      logger.error('Failed to load history', error instanceof Error ? error : new Error(String(error)));
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (selectedWarehouse) {
      loadInventory();
      loadHistory();
    } else {
      setItems([]);
      setHistory([]);
    }
  }, [selectedWarehouse, loadInventory, loadHistory]);

  useEffect(() => {
    const handleDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.key === STORAGE_KEYS.ITEMS || customEvent.detail.key === 'ITEMS') {
        loadInventory();
      }
      if (customEvent.detail.key === STORAGE_KEYS.HISTORY || customEvent.detail.key === 'HISTORY') {
        loadHistory();
      }
    };

    apiEvents.addEventListener('dataUpdated', handleDataUpdate);
    return () => apiEvents.removeEventListener('dataUpdated', handleDataUpdate);
  }, [loadInventory, loadHistory]);

  const createItem = async (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!user) throw new Error('No user logged in');
    if (!selectedWarehouse) throw new Error('No warehouse selected');

    try {
      const newItem = await api.items.create({ ...data, warehouseId: selectedWarehouse.id });
      toast.success(t('inventory.itemCreated') || 'Item created successfully');
      await loadInventory();
      return newItem;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (t('inventory.createItemError') || 'Failed to create item');
      logger.error('Failed to create item', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    // Optimistic update: update item in state immediately
    const originalItem = items.find(item => item.id === id);
    if (!originalItem) throw new Error('Item not found');

    const optimisticItem = { ...originalItem, ...updates };
    setItems(prev => prev.map(item => item.id === id ? optimisticItem : item));
    
    try {
      await api.items.update(id, updates);
      toast.success(t('inventory.itemUpdated') || 'Item updated successfully');
      apiEvents.emit('ITEMS');
      await loadInventory(); // Reload to get server state
    } catch (error: unknown) {
      // Rollback: restore original item on error
      setItems(prev => prev.map(item => item.id === id ? originalItem : item));
      const message = error instanceof Error ? error.message : (t('inventory.updateItemError') || 'Failed to update item');
      logger.error('Failed to update item', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    // Optimistic update: remove item from state immediately
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    setItems(prev => prev.filter(item => item.id !== id));
    
    try {
      await api.items.delete(id);
      toast.success(t('inventory.itemDeleted') || 'Item deleted successfully');
      apiEvents.emit('ITEMS');
    } catch (error: unknown) {
      // Rollback: restore item on error
      setItems(prev => [...prev, itemToDelete]);
      await loadInventory(); // Reload to ensure consistency
      const message = error instanceof Error ? error.message : (t('inventory.deleteItemError') || 'Failed to delete item');
      logger.error('Failed to delete item', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  const recordMovement = async (itemId: string, type: MovementType, quantity: number, notes?: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      await api.movements.record(itemId, type, quantity, user.id, notes);
      toast.success(t('movement.movementRecorded') || 'Movement recorded successfully');
      await loadInventory();
      await loadHistory();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (t('movement.recordMovementError') || 'Failed to record movement');
      logger.error('Failed to record movement', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  const recordBatchMovements = async (
    movements: Array<{ itemId: string; quantity: number }>,
    type: MovementType,
    notes?: string
  ) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Record each movement sequentially
      for (const movement of movements) {
        await api.movements.record(movement.itemId, type, movement.quantity, user.id, notes);
      }
      toast.success(`${t('movement.batchMovementRecorded') || 'Batch movement recorded'}: ${movements.length} ${t('movement.itemsProcessed') || 'items processed'}`);
      await loadInventory();
      await loadHistory();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (t('movement.recordBatchMovementsError') || 'Failed to record batch movements');
      logger.error('Failed to record batch movements', error instanceof Error ? error : new Error(String(error)));
      toast.error(message);
      throw error;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        history,
        loading,
        createItem,
        updateItem,
        deleteItem,
        recordMovement,
        recordBatchMovements,
        refreshInventory: loadInventory,
        refreshHistory: loadHistory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
