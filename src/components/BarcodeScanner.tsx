import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const { t } = useLocale();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [_isScanning, setIsScanning] = useState(false);

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
        const scanner = new Html5Qrcode('barcode-scanner');
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
            onScan(decodedText);
            stopScanner();
          },
          undefined
        );

        setIsScanning(true);
      } catch (err) {
        logger.error('Error starting scanner', err instanceof Error ? err : new Error(String(err)));
        toast.error(t('movement.scannerError'));
        onClose();
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopScanner]); // stopScanner is stable, onScan and onClose are stable callbacks from parent

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{t('movement.scanBarcode')}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div id="barcode-scanner" className="rounded-lg overflow-hidden border-2 border-primary"></div>
          <p className="text-center text-muted-foreground mt-4">
            {t('movement.scannerHelp')}
          </p>
        </div>
      </div>
    </div>
  );
};
