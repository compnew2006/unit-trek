import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarcodeGenerator } from '@/components/BarcodeGenerator';
import { BarcodeLabelPrinter } from '@/components/BarcodeLabelPrinter';
import { useLocale } from '../hooks/useLocale';
import { useInventory } from '../hooks/useInventory';
import { useWarehouse } from '../hooks/useWarehouse';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Barcode, Printer, Scan, Settings } from 'lucide-react';

export const BarcodeTools: React.FC = () => {
  const { t } = useLocale();
  const { items } = useInventory();
  const { selectedWarehouse } = useWarehouse();
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const selectedItem = items.find(item => item.id === selectedItemId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Barcode className="h-8 w-8" />
          {t('barcode.tools') || 'Barcode Tools'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('barcode.toolsDesc') || 'Generate, print, and manage barcodes for your inventory items'}
        </p>
      </div>

      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generator">
            <Scan className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.generator') || 'Generator'}
          </TabsTrigger>
          <TabsTrigger value="printer">
            <Printer className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.printer') || 'Label Printer'}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.settings') || 'Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <BarcodeGenerator
            onGenerated={(value, type) => {
              console.log('Generated barcode:', value, type);
            }}
          />
        </TabsContent>

        <TabsContent value="printer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('barcode.selectItem') || 'Select Item'}</CardTitle>
              <CardDescription>
                {t('barcode.selectItemDesc') || 'Choose an item to print barcode labels'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="item-select">
                  {t('inventory.name') || 'Item'}
                </Label>
                <Select
                  value={selectedItemId}
                  onValueChange={setSelectedItemId}
                >
                  <SelectTrigger id="item-select">
                    <SelectValue placeholder={t('barcode.selectItemPlaceholder') || 'Select an item'} />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter(item => item.warehouseId === selectedWarehouse?.id)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} {item.barcode ? `(${item.barcode})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedItem && (
            <BarcodeLabelPrinter item={selectedItem} />
          )}

          {!selectedItem && selectedItemId && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {t('barcode.itemNotFound') || 'Item not found'}
                </p>
              </CardContent>
            </Card>
          )}

          {!selectedItemId && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {t('barcode.selectItemToPrint') || 'Select an item above to print barcode labels'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('barcode.scannerSettings') || 'Scanner Settings'}</CardTitle>
              <CardDescription>
                {t('barcode.scannerSettingsDesc') || 'Configure barcode scanner options'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {t('barcode.supportedFormats') || 'Supported Barcode Formats'}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {['CODE128', 'EAN13', 'EAN8', 'UPC', 'CODE39', 'ITF14', 'MSI', 'QR Code'].map((format) => (
                    <div
                      key={format}
                      className="p-2 border rounded-md text-sm text-center bg-muted"
                    >
                      {format}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {t('barcode.scannerInfo') || 'Scanner Information'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('barcode.scannerInfoDesc') || 'The scanner uses your device camera to read barcodes. Make sure you grant camera permissions when prompted.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  {t('barcode.printerInfo') || 'Printer Information'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('barcode.printerInfoDesc') || 'Labels are optimized for A4 paper. Use label sheets or print on regular paper and cut to size.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BarcodeTools;
