import React, { useState, useRef, useEffect, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
// @ts-expect-error - jsbarcode doesn't have type definitions
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Printer, Download, Eye } from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
import { Item } from '../types';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export type BarcodeType = 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14' | 'MSI' | 'pharmacode';

interface BarcodeLabelPrinterProps {
  item?: Item;
  onClose?: () => void;
}

interface LabelTemplate {
  name: string;
  width: number;
  height: number;
  fontSize: number;
  showName: boolean;
  showPrice: boolean;
  showQuantity: boolean;
}

const LABEL_TEMPLATES: Record<string, LabelTemplate> = {
  small: {
    name: 'Small (40x20mm)',
    width: 40,
    height: 20,
    fontSize: 10,
    showName: false,
    showPrice: false,
    showQuantity: false,
  },
  medium: {
    name: 'Medium (50x30mm)',
    width: 50,
    height: 30,
    fontSize: 12,
    showName: true,
    showPrice: false,
    showQuantity: false,
  },
  large: {
    name: 'Large (70x40mm)',
    width: 70,
    height: 40,
    fontSize: 14,
    showName: true,
    showPrice: true,
    showQuantity: true,
  },
};

export const BarcodeLabelPrinter: React.FC<BarcodeLabelPrinterProps> = ({ item }) => {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('CODE128');
  const [barcodeValue, setBarcodeValue] = useState(item?.barcode || '');
  const [labelTemplate, setLabelTemplate] = useState<string>('medium');
  const [itemName, setItemName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(1);
  const [labelsPerPage, setLabelsPerPage] = useState(1);

  useEffect(() => {
    if (item) {
      setBarcodeValue(item.barcode || '');
      setItemName(item.name);
    }
  }, [item]);

  const generateBarcode = useCallback(() => {
    if (!barcodeValue || !canvasRef.current) return;

    try {
      const options: Record<string, unknown> = {
        format: barcodeType,
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      };

      // Specific options for different barcode types
      if (barcodeType === 'EAN13' && barcodeValue.length !== 13) {
        // Pad with zeros if needed
        const padded = barcodeValue.padStart(13, '0');
        setBarcodeValue(padded);
        JsBarcode(canvasRef.current, padded, options);
        return;
      }

      if (barcodeType === 'EAN8' && barcodeValue.length !== 8) {
        const padded = barcodeValue.padStart(8, '0');
        setBarcodeValue(padded);
        JsBarcode(canvasRef.current, padded, options);
        return;
      }

      if (barcodeType === 'UPC' && barcodeValue.length !== 12) {
        const padded = barcodeValue.padStart(12, '0');
        setBarcodeValue(padded);
        JsBarcode(canvasRef.current, padded, options);
        return;
      }

      JsBarcode(canvasRef.current, barcodeValue, options);
    } catch (error: unknown) {
      logger.error('Error generating barcode', error instanceof Error ? error : new Error(String(error)));
    }
  }, [barcodeValue, barcodeType]);

  useEffect(() => {
    generateBarcode();
  }, [generateBarcode]);

  const downloadBarcode = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `barcode-${barcodeValue}.png`;
    link.href = url;
    link.click();
  };

  const printLabels = () => {
    if (!printRef.current) return;

    const template = LABEL_TEMPLATES[labelTemplate];
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Please allow popups to print labels');
      return;
    }

    const labels = Array.from({ length: labelsPerPage }, (_, i) => i);
    const labelHTML = labels.map(() => {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      
      const barcodeImage = canvas.toDataURL('image/png');
      return `
        <div style="
          width: ${template.width}mm;
          height: ${template.height}mm;
          border: 1px dashed #ccc;
          padding: 2mm;
          display: inline-block;
          margin: 2mm;
          page-break-inside: avoid;
          text-align: center;
          font-family: Arial, sans-serif;
        ">
          ${template.showName ? `<div style="font-size: ${template.fontSize}px; font-weight: bold; margin-bottom: 2mm;">${itemName}</div>` : ''}
          <img src="${barcodeImage}" style="max-width: 100%; height: auto;" />
          <div style="font-size: ${template.fontSize - 2}px; margin-top: 2mm;">
            ${barcodeValue}
          </div>
          ${template.showQuantity ? `<div style="font-size: ${template.fontSize - 2}px; margin-top: 1mm;">Qty: ${quantity}</div>` : ''}
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          ${labelHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const previewLabels = () => {
    if (!printRef.current) return;

    const template = LABEL_TEMPLATES[labelTemplate];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const barcodeImage = canvas.toDataURL('image/png');
    const labels = Array.from({ length: Math.min(labelsPerPage, 4) }, (_, i) => i);

    printRef.current.innerHTML = labels.map(() => `
      <div style="
        width: ${template.width}mm;
        height: ${template.height}mm;
        border: 1px solid #000;
        padding: 2mm;
        display: inline-block;
        margin: 2mm;
        text-align: center;
        font-family: Arial, sans-serif;
        transform: scale(2);
        transform-origin: top left;
      ">
        ${template.showName ? `<div style="font-size: ${template.fontSize}px; font-weight: bold; margin-bottom: 2mm;">${itemName}</div>` : ''}
        <img src="${barcodeImage}" style="max-width: 100%; height: auto;" />
        <div style="font-size: ${template.fontSize - 2}px; margin-top: 2mm;">
          ${barcodeValue}
        </div>
        ${template.showQuantity ? `<div style="font-size: ${template.fontSize - 2}px; margin-top: 1mm;">Qty: ${quantity}</div>` : ''}
      </div>
    `).join('');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t('barcode.printLabel') || 'Print Barcode Label'}</CardTitle>
        <CardDescription>
          {t('barcode.printLabelDesc') || 'Generate and print barcode labels for items'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode-value">
              {t('inventory.barcode') || 'Barcode'}
            </Label>
            <Input
              id="barcode-value"
              value={barcodeValue}
              onChange={(e) => {
                setBarcodeValue(e.target.value);
                generateBarcode();
              }}
              placeholder="Enter barcode"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode-type">
              {t('barcode.type') || 'Barcode Type'}
            </Label>
            <Select
              value={barcodeType}
              onValueChange={(value) => {
                setBarcodeType(value as BarcodeType);
                generateBarcode();
              }}
            >
              <SelectTrigger id="barcode-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CODE128">CODE128 (Recommended)</SelectItem>
                <SelectItem value="EAN13">EAN-13</SelectItem>
                <SelectItem value="EAN8">EAN-8</SelectItem>
                <SelectItem value="UPC">UPC-A</SelectItem>
                <SelectItem value="CODE39">CODE39</SelectItem>
                <SelectItem value="ITF14">ITF-14</SelectItem>
                <SelectItem value="MSI">MSI</SelectItem>
                <SelectItem value="pharmacode">Pharmacode</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-name">
              {t('inventory.name') || 'Item Name'}
            </Label>
            <Input
              id="item-name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-template">
              {t('barcode.labelTemplate') || 'Label Template'}
            </Label>
            <Select value={labelTemplate} onValueChange={setLabelTemplate}>
              <SelectTrigger id="label-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LABEL_TEMPLATES).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              {t('inventory.quantity') || 'Quantity'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels-per-page">
              {t('barcode.labelsPerPage') || 'Labels per Page'}
            </Label>
            <Input
              id="labels-per-page"
              type="number"
              min="1"
              max="20"
              value={labelsPerPage}
              onChange={(e) => setLabelsPerPage(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center justify-center p-4 border rounded-lg bg-muted">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={previewLabels}>
            <Eye className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.preview') || 'Preview'}
          </Button>
          <Button variant="outline" onClick={downloadBarcode}>
            <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.download') || 'Download'}
          </Button>
          <Button onClick={printLabels}>
            <Printer className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.print') || 'Print'}
          </Button>
        </div>

        <div ref={printRef} className="border rounded-lg p-4 min-h-[200px]"></div>
      </CardContent>
    </Card>
  );
};
