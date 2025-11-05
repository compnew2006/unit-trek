import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * EmptyState component displays a placeholder when there's no data to show
 * 
 * @component
 * @param {EmptyStateProps} props - Component props
 * @param {LucideIcon} props.icon - Icon component to display
 * @param {string} props.title - Main title text
 * @param {string} [props.description] - Optional description text
 * @param {string} [props.actionLabel] - Label for primary action button
 * @param {Function} [props.onAction] - Callback for primary action
 * @param {string} [props.secondaryActionLabel] - Label for secondary action button
 * @param {Function} [props.onSecondaryAction] - Callback for secondary action
 * @returns {JSX.Element} Empty state component
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Package}
 *   title="No items found"
 *   description="Get started by adding your first item"
 *   actionLabel="Add Item"
 *   onAction={() => setIsDialogOpen(true)}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <Card className="border-dashed" role="status" aria-live="polite">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4" aria-hidden="true">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {description}
          </p>
        )}
        
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex gap-3">
            {actionLabel && onAction && (
              <Button onClick={onAction} aria-label={actionLabel}>
                {actionLabel}
              </Button>
            )}
            
            {secondaryActionLabel && onSecondaryAction && (
              <Button variant="outline" onClick={onSecondaryAction} aria-label={secondaryActionLabel}>
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

