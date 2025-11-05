import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '../hooks/useLocale';
import { useWarehouse } from '../hooks/useWarehouse';
import { api } from '../services/apiService';
import { Item } from '../types';
import { AlertCircle, ArrowLeft, Package } from 'lucide-react';

export const DuplicateBarcodes: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { warehouses } = useWarehouse();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const filterBarcode = searchParams.get('barcode');

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        const allItems = await api.items.getAll();
        setItems(allItems);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  // Group items by barcode
  const barcodeGroups = useMemo(() => {
    const groups = new Map<string, Item[]>();
    
    items.forEach(item => {
      if (item.barcode && item.barcode.trim() !== '') {
        const barcode = item.barcode.trim();
        if (!groups.has(barcode)) {
          groups.set(barcode, []);
        }
        groups.get(barcode)!.push(item);
      }
    });

    // Filter to only duplicates
    const duplicates = new Map<string, Item[]>();
    groups.forEach((itemsList, barcode) => {
      if (itemsList.length > 1) {
        duplicates.set(barcode, itemsList);
      }
    });

    return duplicates;
  }, [items]);

  // Filter by specific barcode if provided
  const filteredGroups = useMemo(() => {
    if (!filterBarcode) return barcodeGroups;
    
    const filtered = new Map<string, Item[]>();
    if (barcodeGroups.has(filterBarcode)) {
      filtered.set(filterBarcode, barcodeGroups.get(filterBarcode)!);
    }
    return filtered;
  }, [barcodeGroups, filterBarcode]);

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find(w => w.id === warehouseId)?.name || warehouseId;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  const duplicateCount = barcodeGroups.size;
  const totalDuplicateItems = Array.from(barcodeGroups.values()).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              {t('duplicateBarcodes.title') || 'Duplicate Barcodes'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {filterBarcode
                ? `${t('duplicateBarcodes.filteredBy') || 'Showing items with barcode'}: "${filterBarcode}"`
                : t('duplicateBarcodes.subtitle') || 'Items sharing the same barcode'}
            </p>
          </div>
        </div>
      </div>

      {duplicateCount === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t('duplicateBarcodes.noDuplicates') || 'No duplicate barcodes found'}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('duplicateBarcodes.noDuplicatesDesc') || 'All items have unique barcodes.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('duplicateBarcodes.summary') || 'Summary'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    {t('duplicateBarcodes.duplicateBarcodes') || 'Duplicate Barcodes'}
                  </div>
                  <div className="text-2xl font-bold text-destructive">{duplicateCount}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    {t('duplicateBarcodes.totalItems') || 'Total Items Affected'}
                  </div>
                  <div className="text-2xl font-bold text-warning">{totalDuplicateItems}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    {t('duplicateBarcodes.excessItems') || 'Excess Items'}
                  </div>
                  <div className="text-2xl font-bold">
                    {totalDuplicateItems - duplicateCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {Array.from(filteredGroups.entries()).map(([barcode, itemsList]) => (
              <Card key={barcode}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    {t('duplicateBarcodes.barcode') || 'Barcode'}: <code className="font-mono">{barcode}</code>
                    <Badge variant="destructive" className="ml-2">
                      {itemsList.length} {t('common.items') || 'items'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {t('duplicateBarcodes.groupDescription') || 'The following items share this barcode:'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('inventory.name')}</TableHead>
                          <TableHead>{t('allWarehouses.warehouse') || 'Warehouse'}</TableHead>
                          <TableHead>{t('inventory.quantity')}</TableHead>
                          <TableHead>{t('inventory.minQuantity')}</TableHead>
                          <TableHead>{t('inventory.description')}</TableHead>
                          <TableHead>{t('common.actions') || 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsList.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.minQuantity || '-'}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/inventory?item=${item.id}`)}
                              >
                                {t('inventory.viewHistory') || 'View'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DuplicateBarcodes;
