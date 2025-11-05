import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from './FeedbackDialog';
import { MessageSquare } from 'lucide-react';
import { useLocale } from '../hooks/useLocale';

/**
 * FeedbackButton component displays a button that opens a feedback dialog
 * 
 * @component
 * @returns {JSX.Element} Feedback button component
 * @example
 * ```tsx
 * <FeedbackButton />
 * ```
 */
export function FeedbackButton() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
        aria-label={t('feedback.button') || 'Open feedback dialog'}
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        {t('feedback.button') || 'Feedback'}
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

