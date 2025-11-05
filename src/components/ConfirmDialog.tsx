import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconClassName: 'text-destructive',
    confirmClassName: 'bg-destructive hover:bg-destructive/90',
  },
  warning: {
    icon: AlertCircle,
    iconClassName: 'text-warning',
    confirmClassName: 'bg-warning hover:bg-warning/90',
  },
  info: {
    icon: Info,
    iconClassName: 'text-primary',
    confirmClassName: '',
  },
};

/**
 * ConfirmDialog component displays a confirmation dialog with customizable variant
 * 
 * @component
 * @param {ConfirmDialogProps} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Callback when open state changes
 * @param {string} props.title - Dialog title
 * @param {string} props.description - Dialog description text
 * @param {string} [props.confirmLabel='Confirm'] - Label for confirm button
 * @param {string} [props.cancelLabel='Cancel'] - Label for cancel button
 * @param {Function} props.onConfirm - Callback when confirmed
 * @param {ConfirmVariant} [props.variant='danger'] - Visual variant (danger/warning/info)
 * @param {boolean} [props.loading=false] - Whether action is in progress
 * @returns {JSX.Element} Confirmation dialog component
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item?"
 *   onConfirm={handleDelete}
 *   variant="danger"
 * />
 * ```
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'danger',
  loading = false,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 bg-muted ${config.iconClassName}`} aria-hidden="true">
              <Icon className="h-5 w-5" />
            </div>
            <AlertDialogTitle id="confirm-title">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription id="confirm-description" className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} aria-label={cancelLabel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={config.confirmClassName}
            disabled={loading}
            aria-label={confirmLabel}
          >
            {loading ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * Hook to manage confirmation dialog state
 * 
 * Provides a simple API for triggering confirmation dialogs with various options
 * 
 * @returns {Object} Dialog state and control functions
 * @property {boolean} isOpen - Whether dialog is open
 * @property {Object|null} config - Dialog configuration (title, description, callbacks, etc.)
 * @property {Function} confirm - Open dialog with configuration
 * @property {Function} close - Close dialog
 * @example
 * ```tsx
 * const { isOpen, config, confirm, close } = useConfirmDialog();
 * 
 * // Trigger confirmation
 * confirm({
 *   title: 'Delete Item',
 *   description: 'Are you sure?',
 *   onConfirm: () => handleDelete(),
 * });
 * ```
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: ConfirmVariant;
    confirmLabel?: string;
    cancelLabel?: string;
  } | null>(null);

  const confirm = React.useCallback((options: {
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: ConfirmVariant;
    confirmLabel?: string;
    cancelLabel?: string;
  }) => {
    setConfig(options);
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    // Clear config after animation
    setTimeout(() => setConfig(null), 300);
  }, []);

  return {
    isOpen,
    config,
    confirm,
    close,
  };
}
