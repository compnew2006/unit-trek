import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { Plus, Search, Edit, Trash2, History as HistoryIcon, AlertTriangle, Copy, Package } from 'lucide-react';
import { Item } from '../types';
import { ItemHistoryModal } from '../components/ItemHistoryModal';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/skeletons';
import { DataPagination } from '../components/DataPagination';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Inventory: React.FC = () => {
  const { items, createItem, updateItem, deleteItem, loading } = useInventory();
  const { selectedWarehouse, warehouses } = useWarehouse();
  const { t } = useLocale();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300); // Debounce search with 300ms delay
  
  // Sync search with URL for sharing and browser back/forward support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get('search');
    if (urlSearch && urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      const params = new URLSearchParams(window.location.search);
      params.set('search', debouncedSearch);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    } else {
      const params = new URLSearchParams(window.location.search);
      params.delete('search');
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [debouncedSearch]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemName, setHistoryItemName] = useState('');
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [itemToClone, setItemToClone] = useState<Item | null>(null);
  const [cloneWarehouseId, setCloneWarehouseId] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const { isOpen: isConfirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirmDialog();

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    quantity: 0,
    minQuantity: '',
    description: '',
  });

  const filteredItems = useMemo(() => {
    return items.filter(
      item =>
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [items, debouncedSearch]);

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

  const openDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        barcode: item.barcode || '',
        quantity: item.quantity,
        minQuantity: item.minQuantity?.toString() || '',
        description: item.description || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        barcode: '',
        quantity: 0,
        minQuantity: '',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      name: formData.name,
      barcode: formData.barcode || undefined,
      quantity: formData.quantity,
      minQuantity: formData.minQuantity ? Number(formData.minQuantity) : undefined,
      description: formData.description || undefined,
      warehouseId: selectedWarehouse!.id,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemData);
      } else {
        await createItem(itemData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error already handled by context
    }
  };

  const handleDelete = async (item: Item) => {
    confirm({
      title: t('inventory.confirmDelete'),
      description: `${t('inventory.deleteWarning')}: ${item.name}`,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteItem(item.id);
        } catch (error) {
          // Error handled by context
        }
      },
    });
  };

  const openHistory = (item: Item) => {
    setHistoryItemId(item.id);
    setHistoryItemName(item.name);
  };

  const openCloneDialog = (item: Item) => {
    setItemToClone(item);
    setCloneWarehouseId('');
    setIsCloneDialogOpen(true);
  };

  const handleClone = async () => {
    if (!itemToClone || !cloneWarehouseId) {
      toast.error('Please select a destination warehouse');
      return;
    }

    if (cloneWarehouseId === selectedWarehouse?.id) {
      toast.error('Cannot clone to the same warehouse');
      return;
    }

    try {
      // Create a new item with same details but different warehouse
      await createItem({
        name: itemToClone.name,
        barcode: itemToClone.barcode,
        quantity: 0, // Start with 0 quantity when cloning
        minQuantity: itemToClone.minQuantity,
        description: itemToClone.description,
        warehouseId: cloneWarehouseId,
      });
      toast.success(`Item cloned to ${warehouses.find(w => w.id === cloneWarehouseId)?.name || 'warehouse'}`);
      setIsCloneDialogOpen(false);
      setItemToClone(null);
    } catch (error) {
      // Error handled by context
    }
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
          <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
          <Button disabled>
            <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('inventory.addItem')}
          </Button>
        </div>
        <TableSkeleton rows={8} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          {t('inventory.addItem')}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('inventory.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ltr:pl-10 rtl:pr-10"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory.name')}</TableHead>
              <TableHead>{t('inventory.barcode')}</TableHead>
              <TableHead>{t('inventory.quantity')}</TableHead>
              <TableHead>{t('inventory.minQuantity')}</TableHead>
              <TableHead>{t('inventory.description')}</TableHead>
              <TableHead className="text-right">{t('inventory.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {t('common.loading')}
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
                  <TableCell>
                    <span className={item.minQuantity && item.quantity <= item.minQuantity ? 'text-warning font-semibold' : ''}>
                      {item.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{item.minQuantity || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openHistory(item)}
                        title={t('inventory.viewHistory')}
                      >
                        <HistoryIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCloneDialog(item)}
                        title="Clone to another warehouse"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('inventory.editItem') : t('inventory.createItem')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('inventory.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">{t('inventory.barcode')}</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('inventory.quantity')} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minQuantity">{t('inventory.minQuantity')}</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('inventory.description')}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {historyItemId && (
        <ItemHistoryModal
          itemId={historyItemId}
          itemName={historyItemName}
          isOpen={!!historyItemId}
          onClose={() => setHistoryItemId(null)}
        />
      )}

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Item to Another Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item to Clone</Label>
              <p className="text-sm text-muted-foreground">
                {itemToClone?.name} (Current: {selectedWarehouse?.name})
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloneWarehouse">Destination Warehouse *</Label>
              <Select value={cloneWarehouseId} onValueChange={setCloneWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter((w) => w.id !== selectedWarehouse?.id)
                    .map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleClone}>Clone Item</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {confirmConfig && (
        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={closeConfirm}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          cancelLabel={confirmConfig.cancelLabel}
          variant={confirmConfig.variant}
          onConfirm={confirmConfig.onConfirm}
        />
      )}
    </div>
  );
};

export default Inventory;
