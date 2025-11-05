import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useAuth } from '../hooks/useAuth';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { excelService } from '../services/excelService';
import { api } from '../services/apiService';
import { toast } from 'sonner';
import { Item } from '../types';

export const ImportExport: React.FC = () => {
  const { items, history, refreshInventory } = useInventory();
  const { selectedWarehouse } = useWarehouse();
  const { user } = useAuth();
  const { t } = useLocale();

  const [previewItems, setPreviewItems] = useState<Partial<Item>[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const items = await excelService.importItems(file);
      setPreviewItems(items);
      toast.success(`${items.length} ${t('importExport.itemsToImport')}`);
    } catch (error) {
      toast.error(t('importExport.importError'));
      console.error('Import error:', error);
    }
  };

  const handleImport = async () => {
    if (!selectedWarehouse || !user) return;

    setImporting(true);
    try {
      const itemsData = previewItems.map((item) => ({
        ...item,
        warehouseId: selectedWarehouse.id,
        quantity: item.quantity || 0,
      })) as Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[];

      await api.items.bulkCreate(itemsData);
      toast.success(t('importExport.importSuccess'));
      setPreviewItems([]);
      refreshInventory();
    } catch (error) {
      toast.error(t('importExport.importError'));
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate();
    toast.success(t('importExport.templateDownloaded'));
  };

  const handleExportItems = () => {
    if (!selectedWarehouse) return;
    excelService.exportItems(items, selectedWarehouse.name);
    toast.success(t('importExport.exportSuccess'));
  };

  const handleExportHistory = () => {
    if (!selectedWarehouse) return;
    excelService.exportHistory(history, selectedWarehouse.name);
    toast.success(t('importExport.exportSuccess'));
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('importExport.title')}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('importExport.import')}
            </CardTitle>
            <CardDescription>
              {t('importExport.importDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={handleDownloadTemplate} 
                variant="secondary" 
                className="w-full"
              >
                <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('importExport.downloadTemplate')}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t('importExport.templateHelp')}
              </p>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {t('importExport.dragDrop')}
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild variant="outline">
                  <span>{t('importExport.selectFile')}</span>
                </Button>
              </label>
            </div>

            {previewItems.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">
                  {previewItems.length} {t('importExport.itemsToImport')}
                </p>
                <Button onClick={handleImport} disabled={importing} className="w-full">
                  {importing ? t('common.loading') : t('importExport.confirmImport')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('importExport.export')}
            </CardTitle>
            <CardDescription>
              {t('importExport.exportDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExportItems} variant="outline" className="w-full">
              <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('importExport.exportItems')} ({items.length})
            </Button>
            <Button onClick={handleExportHistory} variant="outline" className="w-full">
              <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('importExport.exportHistory')} ({history.length})
            </Button>
          </CardContent>
        </Card>
      </div>

      {previewItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('importExport.preview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('inventory.name')}</TableHead>
                    <TableHead>{t('inventory.barcode')}</TableHead>
                    <TableHead>{t('inventory.quantity')}</TableHead>
                    <TableHead>{t('inventory.minQuantity')}</TableHead>
                    <TableHead>{t('inventory.description')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewItems.slice(0, 10).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.barcode || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.minQuantity || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {previewItems.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        ... and {previewItems.length - 10} more items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportExport;
