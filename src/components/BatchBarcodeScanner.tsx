import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X, Check, Trash2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types';

interface ScannedItem {
  item: Item;
  quantity: number;
  barcode: string;
  timestamp: Date;
}

interface BatchBarcodeScannerProps {
  items: Item[];
  onConfirm: (scannedItems: Array<{ itemId: string; quantity: number }>) => void;
  onClose: () => void;
  movementType?: 'in' | 'out';
}

export const BatchBarcodeScanner: React.FC<BatchBarcodeScannerProps> = ({
  items,
  onConfirm,
  onClose,
  movementType = 'in',
}) => {
  const { t } = useLocale();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [_isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<Map<string, ScannedItem>>(new Map());
  const [scannerId] = useState(() => `batch-scanner-${Date.now()}`);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    const item = items.find((i) => i.barcode === barcode);
    
    if (!item) {
      toast.error(`Item with barcode ${barcode} not found`);
      return;
    }

    setScannedItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(item.id);
      
      if (existing) {
        // Increment quantity if item already scanned
        newMap.set(item.id, {
          ...existing,
          quantity: existing.quantity + 1,
          timestamp: new Date(),
        });
      } else {
        // Add new scanned item
        newMap.set(item.id, {
          item,
          quantity: 1,
          barcode,
          timestamp: new Date(),
        });
      }
      
      return newMap;
    });

    toast.success(`${item.name} added (barcode: ${barcode})`);
  }, [items]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          setIsScanning(false);
        })
        .catch((err) => {
          logger.error('Error stopping scanner', err instanceof Error ? err : new Error(String(err)));
        });
    }
  }, []);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleBarcodeScanned(decodedText);
          },
          undefined
        );

        setIsScanning(true);
      } catch (err) {
        logger.error('Error starting scanner', err instanceof Error ? err : new Error(String(err)));
        toast.error(t('movement.scannerError'));
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [scannerId, handleBarcodeScanned, t, stopScanner]);

  const handleManualAdd = (barcode: string) => {
    handleBarcodeScanned(barcode);
  };

  const handleRemoveItem = (itemId: string) => {
    setScannedItems((prev) => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setScannedItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, {
          ...existing,
          quantity,
        });
      }
      return newMap;
    });
  };

  const handleConfirm = () => {
    const itemsToProcess = Array.from(scannedItems.values()).map((scanned) => ({
      itemId: scanned.item.id,
      quantity: scanned.quantity,
    }));

    if (itemsToProcess.length === 0) {
      toast.error('Please scan at least one item');
      return;
    }

    onConfirm(itemsToProcess);
    stopScanner();
    onClose();
  };

  const scannedItemsArray = Array.from(scannedItems.values());

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Batch Barcode Scanner</h2>
          <Badge variant="secondary">{scannedItemsArray.length} items</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        {/* Scanner Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div id={scannerId} className="rounded-lg overflow-hidden border-2 border-primary"></div>
            <p className="text-center text-muted-foreground mt-4">
              Scan barcodes to add items. Items will be listed below.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const barcode = prompt('Enter barcode manually:');
                  if (barcode) handleManualAdd(barcode.trim());
                }}
              >
                Enter Barcode Manually
              </Button>
            </div>
          </div>
        </div>

        {/* Scanned Items List */}
        <div className="flex-1 border rounded-lg p-4 overflow-hidden flex flex-col">
          <h3 className="font-semibold mb-4">Scanned Items ({scannedItemsArray.length})</h3>
          {scannedItemsArray.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>No items scanned yet. Start scanning to add items.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Scan Qty</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scannedItemsArray.map((scanned) => (
                      <TableRow key={scanned.item.id}>
                        <TableCell className="font-medium">{scanned.item.name}</TableCell>
                        <TableCell>{scanned.barcode}</TableCell>
                        <TableCell>{scanned.item.quantity}</TableCell>
                        <TableCell>
                          <input
                            type="number"
                            min="1"
                            value={scanned.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                scanned.item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(scanned.item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex gap-2 justify-end border-t pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} className="gap-2">
                  <Check className="h-4 w-4" />
                  Confirm {movementType === 'in' ? 'Stock In' : 'Stock Out'} (
                  {scannedItemsArray.length} items)
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
