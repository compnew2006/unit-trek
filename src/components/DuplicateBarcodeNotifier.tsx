import React, { useEffect, useState } from 'react';
import { api, apiEvents } from '../services/apiService';
import { useWarehouse } from '../hooks/useWarehouse';
import { useNotifications } from '../context/NotificationContext';
import { useLocale } from '../hooks/useLocale';
import { Item } from '../types';
import { STORAGE_KEYS } from '../constants';
import { logger } from '../utils/logger';

export const DuplicateBarcodeNotifier: React.FC = () => {
  const { warehouses } = useWarehouse();
  const { addNotification } = useNotifications();
  const { t } = useLocale();
  const [allItems, setAllItems] = useState<Item[]>([]);

  const loadAllItems = async () => {
    try {
      const items = await api.items.getAll();
      setAllItems(items);
    } catch (error) {
      logger.error('Failed to load items for duplicate check', error instanceof Error ? error : new Error(String(error)));
    }
  };

  useEffect(() => {
    loadAllItems();

    // Listen for item updates
    const handleDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.key === STORAGE_KEYS.ITEMS || customEvent.detail.key === 'ITEMS') {
        loadAllItems();
      }
    };

    apiEvents.addEventListener('dataUpdated', handleDataUpdate);

    // Refresh items periodically to catch new duplicates
    const interval = setInterval(loadAllItems, 30000); // Check every 30 seconds

    return () => {
      apiEvents.removeEventListener('dataUpdated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (allItems.length === 0 || warehouses.length === 0) return;

    // Find duplicate barcodes (excluding empty/null barcodes)
    const barcodeMap = new Map<string, Item[]>();
    
    allItems.forEach(item => {
      if (item.barcode && item.barcode.trim() !== '') {
        const barcode = item.barcode.trim();
        if (!barcodeMap.has(barcode)) {
          barcodeMap.set(barcode, []);
        }
        barcodeMap.get(barcode)!.push(item);
      }
    });

    // Check for duplicates and show notifications
    barcodeMap.forEach((items, barcode) => {
      if (items.length > 1) {
        const warehouseNames = items.map(item => {
          const warehouse = warehouses.find(w => w.id === item.warehouseId);
          return warehouse?.name || item.warehouseId;
        }).join(', ');

        const itemNames = items.map(item => item.name).join(', ');

        const message = `"${barcode}" ${t('inventory.duplicateBarcodeUsedBy') || 'is used by'} ${items.length} ${t('common.items') || 'items'}: ${itemNames} (${t('allWarehouses.warehouse') || 'Warehouses'}: ${warehouseNames})`;
        addNotification({
          type: 'duplicate_barcode',
          title: t('inventory.duplicateBarcodeAlert') || 'Duplicate barcode detected',
          message,
          metadata: { key: `duplicate-barcode-${barcode}`, barcode },
        });
      }
    });
  }, [allItems, warehouses, addNotification, t]);

  return null;
};
