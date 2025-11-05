import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInventory } from '../hooks/useInventory';
import { useWarehouse } from '../hooks/useWarehouse';
import { useLocale } from '../hooks/useLocale';
import { usePagination } from '../hooks/usePagination';
import { Download, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { TableSkeleton } from '../components/skeletons';
import { DataPagination } from '../components/DataPagination';
import { DateRangePicker } from '../components/DateRangePicker';
import { excelService } from '../services/excelService';
import { MovementType } from '../types';
import { toast } from 'sonner';
import { useConfirmDialog, ConfirmDialog } from '../components/ConfirmDialog';

export const History: React.FC = () => {
  const { history, items, recordMovement, loading } = useInventory();
  const { selectedWarehouse } = useWarehouse();
  const { t } = useLocale();
  const { isOpen, config, confirm, close } = useConfirmDialog();

  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all');
  const [itemFilter, setItemFilter] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sync filters with URL for sharing and browser back/forward support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type');
    const urlItem = params.get('item');
    const urlFrom = params.get('from');
    const urlTo = params.get('to');
    
    if (urlType && urlType !== typeFilter) setTypeFilter(urlType as MovementType | 'all');
    if (urlItem && urlItem !== itemFilter) setItemFilter(urlItem);
    if (urlFrom) setDateFrom(new Date(urlFrom));
    if (urlTo) setDateTo(new Date(urlTo));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }
    
    if (itemFilter !== 'all') {
      params.set('item', itemFilter);
    } else {
      params.delete('item');
    }
    
    if (dateFrom) {
      params.set('from', dateFrom.toISOString().split('T')[0]);
    } else {
      params.delete('from');
    }
    
    if (dateTo) {
      params.set('to', dateTo.toISOString().split('T')[0]);
    } else {
      params.delete('to');
    }
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [typeFilter, itemFilter, dateFrom, dateTo]);

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const entryDate = new Date(entry.timestamp);

      if (dateFrom && entryDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (entryDate > endOfDay) return false;
      }
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (itemFilter !== 'all' && entry.itemId !== itemFilter) return false;

      return true;
    });
  }, [history, dateFrom, dateTo, typeFilter, itemFilter]);

  const {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredHistory, itemsPerPage });

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

  const handleExport = () => {
    if (!selectedWarehouse) return;
    excelService.exportHistory(filteredHistory, selectedWarehouse.name);
  };

  const handleUndo = async (entry: HistoryEntry) => {
    confirm({
      title: t('history.undo'),
      description: t('history.confirmUndo'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.no'),
      variant: 'warning',
      onConfirm: async () => {
        try {
          // Calculate the exact reverse movement based on previous and new quantities
          const delta = entry.newQuantity - entry.previousQuantity;
          const reverseType: MovementType = delta > 0 ? 'out' : delta < 0 ? 'in' : 'adjustment';
          const reverseQuantity = Math.abs(delta);
          const notes = `${t('history.undoNote')}: ${entry.notes || t('history.movement')} (${format(new Date(entry.timestamp), 'PPp')})`;
          
          await recordMovement(entry.itemId, reverseType, reverseQuantity, notes);
          toast.success(t('history.undoSuccess'));
        } catch (error) {
          toast.error(t('history.undoError'));
        }
      },
    });
  };

  if (!selectedWarehouse) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          {t('dashboard.selectWarehouse')}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('history.title')}</h1>
          <Button disabled>
            <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('history.export')}
          </Button>
        </div>
        <TableSkeleton rows={10} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('history.title')}</h1>
        <Button onClick={handleExport}>
          <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          {t('history.export')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onSelect={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />

        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as MovementType | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('history.filterByType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('history.allTypes')}</SelectItem>
            <SelectItem value="in">{t('history.in')}</SelectItem>
            <SelectItem value="out">{t('history.out')}</SelectItem>
            <SelectItem value="adjustment">{t('history.adjustment')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={itemFilter} onValueChange={setItemFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('history.filterByItem')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('history.allItems')}</SelectItem>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('history.timestamp')}</TableHead>
              <TableHead>{t('history.item')}</TableHead>
              <TableHead>{t('history.type')}</TableHead>
              <TableHead>{t('history.quantity')}</TableHead>
              <TableHead>{t('history.previousQty')}</TableHead>
              <TableHead>{t('history.newQty')}</TableHead>
              <TableHead>{t('history.user')}</TableHead>
              <TableHead>{t('history.notes')}</TableHead>
              <TableHead className="text-right">{t('history.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {t('history.noHistory')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(entry.timestamp), 'PPp')}
                  </TableCell>
                  <TableCell>{entry.itemName}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getTypeColor(entry.type)}`}>
                      {t(`history.${entry.type}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getTypeColor(entry.type)}>
                      {entry.type === 'in' ? '+' : entry.type === 'out' ? '-' : '±'}
                      {entry.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{entry.previousQuantity}</TableCell>
                  <TableCell>{entry.newQuantity}</TableCell>
                  <TableCell>{entry.username}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUndo(entry)}
                      title={t('history.undo')}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {config && (
        <ConfirmDialog
          open={isOpen}
          onOpenChange={close}
          title={config.title}
          description={config.description}
          confirmLabel={config.confirmLabel}
          cancelLabel={config.cancelLabel}
          variant={config.variant || 'danger'}
          onConfirm={config.onConfirm}
        />
      )}
    </div>
  );
};

export default History;
