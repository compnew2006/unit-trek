import React, { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '../components/skeletons';
import { DataPagination } from '../components/DataPagination';
import { logger } from '../utils/logger';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWarehouse } from '../hooks/useWarehouse';
import { useLocale } from '../hooks/useLocale';
import { api } from '../services/apiService';
import { Item } from '../types';
import { Search, AlertTriangle } from 'lucide-react';

export const AllWarehouses: React.FC = () => {
  const { warehouses } = useWarehouse();
  const { t } = useLocale();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300); // Debounce search with 300ms delay
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sync search and filters with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get('search');
    const urlWarehouse = params.get('warehouse');
    
    if (urlSearch && urlSearch !== search) setSearch(urlSearch);
    if (urlWarehouse && urlWarehouse !== warehouseFilter) setWarehouseFilter(urlWarehouse);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }
    
    if (warehouseFilter !== 'all') {
      params.set('warehouse', warehouseFilter);
    } else {
      params.delete('warehouse');
    }
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [debouncedSearch, warehouseFilter]);

  // Load all items from all warehouses
  useEffect(() => {
    const loadAllItems = async () => {
      setLoading(true);
      try {
        const data = await api.items.getAll();
        setItems(data);
      } catch (error) {
        logger.error('Failed to load all items', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    loadAllItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesWarehouse =
        warehouseFilter === 'all' || item.warehouseId === warehouseFilter;

      return matchesSearch && matchesWarehouse;
    });
  }, [items, debouncedSearch, warehouseFilter]);

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse?.name || warehouseId;
  };

  const totalFilteredItems = filteredItems.length;
  const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = filteredItems.filter(
    (item) => item.minQuantity && item.quantity <= item.minQuantity
  ).length;

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
  } = usePagination({ data: filteredItems, itemsPerPage });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('allWarehouses.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('allWarehouses.subtitle')}</p>
        </div>
        <TableSkeleton rows={10} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('allWarehouses.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('allWarehouses.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">{t('allWarehouses.totalItems')}</div>
          <div className="text-2xl font-bold mt-1">{totalFilteredItems}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">{t('allWarehouses.totalQuantity')}</div>
          <div className="text-2xl font-bold mt-1">{totalQuantity}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">{t('allWarehouses.lowStock')}</div>
          <div className="text-2xl font-bold mt-1 text-warning">{lowStockItems}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('inventory.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ltr:pl-10 rtl:pr-10"
          />
        </div>

        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder={t('allWarehouses.filterByWarehouse')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allWarehouses.allWarehouses')}</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory.name')}</TableHead>
              <TableHead>{t('inventory.barcode')}</TableHead>
              <TableHead>{t('allWarehouses.warehouse')}</TableHead>
              <TableHead>{t('inventory.quantity')}</TableHead>
              <TableHead>{t('inventory.minQuantity')}</TableHead>
              <TableHead>{t('inventory.description')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('common.loading') || 'Loading...'}
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('inventory.noItems')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.name}
                      {item.minQuantity && item.quantity <= item.minQuantity && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.barcode || '-'}</TableCell>
                  <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.minQuantity && item.quantity <= item.minQuantity
                          ? 'text-warning font-semibold'
                          : ''
                      }
                    >
                      {item.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{item.minQuantity || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.description || '-'}
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
    </div>
  );
};

export default AllWarehouses;
