import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useWarehouse } from '../hooks/useWarehouse';
import { useLocale } from '../hooks/useLocale';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { Warehouse } from '../types';
import { format } from 'date-fns';
import { useConfirmDialog, ConfirmDialog } from '../components/ConfirmDialog';

export const Warehouses: React.FC = () => {
  const { warehouses, createWarehouse, updateWarehouse, deleteWarehouse, setSelectedWarehouse } = useWarehouse();
  const { t } = useLocale();
  const { isOpen, config, confirm, close } = useConfirmDialog();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
  });

  const openDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        location: warehouse.location || '',
        description: warehouse.description || '',
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        location: '',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const warehouseData = {
      name: formData.name,
      location: formData.location || undefined,
      description: formData.description || undefined,
    };

    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, warehouseData);
      } else {
        await createWarehouse(warehouseData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error already handled by context
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    confirm({
      title: t('warehouses.confirmDelete'),
      description: `${t('warehouses.confirmDelete')}: ${warehouse.name}`,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        await deleteWarehouse(warehouse.id);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('warehouses.title')}</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          {t('warehouses.addWarehouse')}
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('warehouses.name')}</TableHead>
              <TableHead>{t('warehouses.location')}</TableHead>
              <TableHead>{t('warehouses.description')}</TableHead>
              <TableHead>{t('warehouses.createdAt')}</TableHead>
              <TableHead className="text-right">{t('warehouses.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('warehouses.noWarehouses')}
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell>
                    {warehouse.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {warehouse.location}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{warehouse.description || '-'}</TableCell>
                  <TableCell>{format(new Date(warehouse.createdAt), 'PP')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWarehouse(warehouse)}
                      >
                        {t('warehouses.switchWarehouse')}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDialog(warehouse)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(warehouse)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? t('warehouses.editWarehouse') : t('warehouses.createWarehouse')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('warehouses.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('warehouses.location')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('warehouses.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
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

export default Warehouses;
