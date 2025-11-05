import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '../services/apiService';
import { HistoryEntry } from '../types';
import { useLocale } from '../hooks/useLocale';
import { logger } from '../utils/logger';
import { format } from 'date-fns';

interface ItemHistoryModalProps {
  itemId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemHistoryModal: React.FC<ItemHistoryModalProps> = ({
  itemId,
  itemName,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLocale();

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.history.getByItem(itemId);
      setHistory(data);
    } catch (error: unknown) {
      logger.error('Failed to load history', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (isOpen && itemId) {
      loadHistory();
    }
  }, [isOpen, itemId, loadHistory]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'text-success';
      case 'out':
        return 'text-destructive';
      case 'adjustment':
        return 'text-warning';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('inventory.viewHistory')} - {itemName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t('history.noHistory')}</div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${getTypeColor(entry.type)}`}>
                      {t(`history.${entry.type}`)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.timestamp), 'PPpp')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('history.user')}: {entry.username}
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('history.notes')}: {entry.notes}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {entry.previousQuantity} → {entry.newQuantity}
                  </div>
                  <div className={`text-xs ${getTypeColor(entry.type)}`}>
                    {entry.type === 'in' ? '+' : entry.type === 'out' ? '-' : '±'}
                    {entry.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
