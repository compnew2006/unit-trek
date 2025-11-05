import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventory } from '../hooks/useInventory';
import { useWarehouse } from '../hooks/useWarehouse';
import { useLocale } from '../hooks/useLocale';
import { Scan, Plus, Minus, Edit, Camera, Package } from 'lucide-react';
import { Item } from '../types';
import { toast } from 'sonner';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { BatchBarcodeScanner } from '../components/BatchBarcodeScanner';

export const Movement: React.FC = () => {
  const { items, recordMovement, recordBatchMovements } = useInventory();
  const { selectedWarehouse } = useWarehouse();
  const { t } = useLocale();

  const [barcode, setBarcode] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [isAdjustmentMode, setIsAdjustmentMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showBatchScanner, setShowBatchScanner] = useState(false);
  const [batchMovementType, setBatchMovementType] = useState<'in' | 'out'>('in');

  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedItemId);
  }, [items, selectedItemId]);

  const handleBarcodeInput = (value: string) => {
    setBarcode(value);
    if (value) {
      const item = items.find(i => i.barcode === value);
      if (item) {
        setSelectedItemId(item.id);
        toast.success(t('movement.itemFound'));
      }
    }
  };

  const handleScan = (scannedBarcode: string) => {
    handleBarcodeInput(scannedBarcode);
    setShowScanner(false);
  };

  const handleQuickMovement = async (type: 'in' | 'out') => {
    if (!selectedItemId) {
      toast.error(t('movement.selectItemFirst'));
      return;
    }

    try {
      await recordMovement(selectedItemId, type, 1, notes || undefined);
      setNotes('');
    } catch (error) {
      // Error handled by context
    }
  };

  const handleAdjustment = async () => {
    if (!selectedItemId || !quantity) {
      toast.error(t('movement.selectItemFirst'));
      return;
    }

    const newQuantity = Number(quantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error('Invalid quantity');
      return;
    }

    try {
      await recordMovement(selectedItemId, 'adjustment', newQuantity, notes || undefined);
      setQuantity('1');
      setNotes('');
      setIsAdjustmentMode(false);
    } catch (error) {
      // Error handled by context
    }
  };

  const handleBatchScan = (movementType: 'in' | 'out') => {
    setBatchMovementType(movementType);
    setShowBatchScanner(true);
  };

  const handleBatchConfirm = async (scannedItems: Array<{ itemId: string; quantity: number }>) => {
    try {
      await recordBatchMovements(scannedItems, batchMovementType, notes || undefined);
      setNotes('');
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

  return (
    <>
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
      {showBatchScanner && (
        <BatchBarcodeScanner
          items={items}
          onConfirm={handleBatchConfirm}
          onClose={() => setShowBatchScanner(false)}
          movementType={batchMovementType}
        />
      )}
      
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">{t('movement.title')}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t('movement.quickScan')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">
                <Scan className="inline ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('movement.barcodePlaceholder')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => handleBarcodeInput(e.target.value)}
                  placeholder={t('movement.barcodePlaceholder')}
                  autoFocus
                />
                <Button variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Button
                onClick={() => handleBatchScan('in')}
                variant="outline"
                className="flex-1"
              >
                <Package className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('movement.batchScanIn')}
              </Button>
              <Button
                onClick={() => handleBatchScan('out')}
                variant="outline"
                className="flex-1"
              >
                <Package className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('movement.batchScanOut')}
              </Button>
            </div>

          <div className="space-y-2">
            <Label htmlFor="item">{t('movement.selectItem')}</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder={t('movement.selectItem')} />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <Card className="bg-accent/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t('inventory.name')}</div>
                    <div className="font-medium">{selectedItem.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('inventory.quantity')}</div>
                    <div className="font-medium text-2xl">{selectedItem.quantity}</div>
                  </div>
                  {selectedItem.barcode && (
                    <div>
                      <div className="text-muted-foreground">{t('inventory.barcode')}</div>
                      <div className="font-medium">{selectedItem.barcode}</div>
                    </div>
                  )}
                  {selectedItem.minQuantity && (
                    <div>
                      <div className="text-muted-foreground">{t('inventory.minQuantity')}</div>
                      <div className="font-medium">{selectedItem.minQuantity}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t('movement.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('movement.notes')}
              rows={2}
            />
          </div>

          {!isAdjustmentMode ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleQuickMovement('in')}
                disabled={!selectedItemId}
                className="bg-success hover:bg-success/90"
              >
                <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('movement.addStock')}
              </Button>
              <Button
                onClick={() => handleQuickMovement('out')}
                disabled={!selectedItemId}
                variant="destructive"
              >
                <Minus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('movement.removeStock')}
              </Button>
              <Button
                onClick={() => setIsAdjustmentMode(true)}
                disabled={!selectedItemId}
                variant="outline"
                className="col-span-2"
              >
                <Edit className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('movement.editQuantity')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newQuantity">{t('movement.newQuantity')}</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setIsAdjustmentMode(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAdjustment} className="bg-warning hover:bg-warning/90">
                  {t('movement.recordMovement')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default Movement;
