import React, { useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useWarehouse } from '../hooks/useWarehouse';
import { useNotifications } from '../context/NotificationContext';
import { useLocale } from '../hooks/useLocale';

/**
 * LowStockNotifier component monitors inventory items and creates notifications
 * for items that are at or below their minimum quantity threshold
 * 
 * @component
 * @returns {null} Component doesn't render anything (side-effect only)
 * @example
 * ```tsx
 * <LowStockNotifier />
 * ```
 */
export const LowStockNotifier: React.FC = () => {
  const { items } = useInventory();
  const { selectedWarehouse } = useWarehouse();
  const { addNotification } = useNotifications();
  const { t } = useLocale();

  useEffect(() => {
    if (!selectedWarehouse || items.length === 0) return;

    const lowStockItems = items.filter(
      item => item.minQuantity && item.quantity <= item.minQuantity
    );

    if (lowStockItems.length > 0) {
      lowStockItems.forEach(item => {
        addNotification({
          type: 'low_stock',
          title: t('inventory.lowStockAlert') || 'Low stock!',
          message: `${item.name}: ${item.quantity}/${item.minQuantity}`,
          metadata: { key: `low-stock-${item.id}`, itemId: item.id },
        });
      });
    }
  }, [items, selectedWarehouse, addNotification, t]);

  return null;
};
