import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Download, RefreshCw } from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
import { logger } from '../utils/logger';
import { BarcodeType } from './BarcodeLabelPrinter';

interface BarcodeGeneratorProps {
  initialValue?: string;
  initialType?: BarcodeType;
  onGenerated?: (barcodeValue: string, barcodeType: BarcodeType) => void;
}

const BARCODE_TYPE_INFO: Record<BarcodeType, { name: string; minLength: number; maxLength: number; pattern?: RegExp }> = {
  CODE128: { name: 'CODE128', minLength: 1, maxLength: 255 },
  EAN13: { name: 'EAN-13', minLength: 12, maxLength: 13, pattern: /^\d{12,13}$/ },
  EAN8: { name: 'EAN-8', minLength: 7, maxLength: 8, pattern: /^\d{7,8}$/ },
  UPC: { name: 'UPC-A', minLength: 11, maxLength: 12, pattern: /^\d{11,12}$/ },
  CODE39: { name: 'CODE39', minLength: 1, maxLength: 255, pattern: /^[0-9A-Z\s$%+\-./]*$/ },
  ITF14: { name: 'ITF-14', minLength: 13, maxLength: 14, pattern: /^\d{13,14}$/ },
  MSI: { name: 'MSI', minLength: 1, maxLength: 255, pattern: /^\d+$/ },
  pharmacode: { name: 'Pharmacode', minLength: 1, maxLength: 6, pattern: /^\d{1,6}$/ },
};

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  initialValue = '',
  initialType = 'CODE128',
  onGenerated,
}) => {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [barcodeValue, setBarcodeValue] = useState(initialValue);
  const [barcodeType, setBarcodeType] = useState<BarcodeType>(initialType);
  const [error, setError] = useState<string>('');

  const validateBarcode = useCallback((value: string, type: BarcodeType): boolean => {
    const info = BARCODE_TYPE_INFO[type];
    
    if (value.length < info.minLength || value.length > info.maxLength) {
      setError(`${info.name} requires ${info.minLength}-${info.maxLength} characters`);
      return false;
    }

    if (info.pattern && !info.pattern.test(value)) {
      setError(`Invalid format for ${info.name}`);
      return false;
    }

    setError('');
    return true;
  }, []);

  const generateBarcode = useCallback(() => {
    if (!barcodeValue || !canvasRef.current) {
      setError('');
      return;
    }

    if (!validateBarcode(barcodeValue, barcodeType)) {
      return;
    }

    try {
      // Format value for specific barcode types
      let formattedValue = barcodeValue;

      if (barcodeType === 'EAN13' && formattedValue.length === 12) {
        formattedValue = formattedValue.padStart(13, '0');
      } else if (barcodeType === 'EAN8' && formattedValue.length === 7) {
        formattedValue = formattedValue.padStart(8, '0');
      } else if (barcodeType === 'UPC' && formattedValue.length === 11) {
        formattedValue = formattedValue.padStart(12, '0');
      } else if (barcodeType === 'ITF14' && formattedValue.length === 13) {
        formattedValue = formattedValue.padStart(14, '0');
      }

      const options: Record<string, unknown> = {
        format: barcodeType,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
      };

      // Type-specific options
      if (barcodeType === 'CODE128') {
        (options as Record<string, unknown>).valid = (valid: boolean) => {
          if (!valid) {
            setError('Invalid CODE128 barcode');
          }
        };
      }

      JsBarcode(canvasRef.current, formattedValue, options);
      
      if (onGenerated) {
        onGenerated(formattedValue, barcodeType);
      }
      
      setError('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate barcode';
      setError(errorMessage);
      logger.error('Barcode generation error', err instanceof Error ? err : new Error(String(err)));
    }
  }, [barcodeValue, barcodeType, onGenerated, validateBarcode]);

  useEffect(() => {
    if (barcodeValue) {
      generateBarcode();
    }
  }, [barcodeValue, barcodeType, generateBarcode]);

  const handleTypeChange = useCallback((newType: BarcodeType) => {
    setBarcodeType(newType);
    if (barcodeValue) {
      generateBarcode();
    }
  }, [barcodeValue, generateBarcode]);

  const downloadBarcode = () => {
    if (!canvasRef.current || !barcodeValue) return;
    
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `barcode-${barcodeValue}-${barcodeType}.png`;
    link.href = url;
    link.click();
  };

  const handleValueChange = (newValue: string) => {
    setBarcodeValue(newValue);
    // Auto-format based on type
    const info = BARCODE_TYPE_INFO[barcodeType];
    if (info.pattern) {
      // Remove invalid characters
      const cleaned = newValue.replace(info.pattern.test(newValue) ? '' : /[^0-9A-Z\s$%+\-./]/gi, '');
      if (cleaned !== newValue) {
        setBarcodeValue(cleaned);
      }
    }
  };

  const info = BARCODE_TYPE_INFO[barcodeType];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('barcode.generate') || 'Generate Barcode'}</CardTitle>
        <CardDescription>
          {t('barcode.generateDesc') || 'Create barcodes in multiple formats'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode-value">
              {t('inventory.barcode') || 'Barcode Value'}
            </Label>
            <Input
              id="barcode-value"
              value={barcodeValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={`Enter ${info.name} (${info.minLength}-${info.maxLength} chars)`}
              maxLength={info.maxLength}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {!error && barcodeValue && (
              <p className="text-sm text-muted-foreground">
                {barcodeValue.length} / {info.maxLength} characters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode-type">
              {t('barcode.type') || 'Barcode Type'}
            </Label>
            <Select
              value={barcodeType}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger id="barcode-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BARCODE_TYPE_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {info.name}: {info.minLength}-{info.maxLength} characters
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 border rounded-lg bg-muted min-h-[120px]">
          {barcodeValue ? (
            <canvas ref={canvasRef} className="max-w-full" />
          ) : (
            <p className="text-muted-foreground">
              {t('barcode.enterValue') || 'Enter a barcode value to generate'}
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={generateBarcode}
            disabled={!barcodeValue}
          >
            <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.regenerate') || 'Regenerate'}
          </Button>
          <Button
            onClick={downloadBarcode}
            disabled={!barcodeValue || !!error}
          >
            <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('barcode.download') || 'Download'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
