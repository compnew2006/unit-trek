import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send } from 'lucide-react';
import { errorTracker } from '../utils/errorTracker';
import { logger } from '../utils/logger';
import { useLocale } from '../hooks/useLocale';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * FeedbackDialog component allows users to submit feedback, bug reports, or feature requests
 * 
 * @component
 * @param {FeedbackDialogProps} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Callback when open state changes
 * @returns {JSX.Element} Feedback dialog component
 * @example
 * ```tsx
 * <FeedbackDialog open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */
export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useLocale();
  const [type, setType] = useState<'bug' | 'feature' | 'question' | 'other'>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: email.trim() || undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      // Also track as message
      await errorTracker.captureMessage(
        `User feedback: ${type}`,
        'info',
        {
          type,
          message: message.trim(),
          email: email.trim() || undefined,
        }
      );

      setSent(true);
      setMessage('');
      setEmail('');
      
      setTimeout(() => {
        setSent(false);
        onOpenChange(false);
      }, 2000);
    } catch (error: unknown) {
      logger.error('Failed to send feedback', error instanceof Error ? error : new Error(String(error)));
      await errorTracker.captureError(error instanceof Error ? error : new Error('Failed to send feedback'), {
        type: 'feedback',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" role="dialog" aria-labelledby="feedback-title" aria-describedby="feedback-description">
        <DialogHeader>
          <DialogTitle id="feedback-title">{t('feedback.title') || 'Send Feedback'}</DialogTitle>
          <DialogDescription id="feedback-description">
            {t('feedback.description') || 'Help us improve by sharing your thoughts, reporting bugs, or suggesting features.'}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center" role="status" aria-live="polite">
            <div className="rounded-full bg-green-100 p-3 mb-4" aria-hidden="true">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">
              {t('feedback.sent') || 'Thank you for your feedback!'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t('feedback.sentMessage') || 'We appreciate your input and will review it soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('feedback.type') || 'Type'}</Label>
              <Select value={type} onValueChange={(value: 'bug' | 'feature' | 'question' | 'other') => setType(value)}>
                <SelectTrigger id="type" aria-label={t('feedback.type') || 'Feedback type'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">
                    {t('feedback.bug') || 'Bug Report'}
                  </SelectItem>
                  <SelectItem value="feature">
                    {t('feedback.feature') || 'Feature Request'}
                  </SelectItem>
                  <SelectItem value="question">
                    {t('feedback.question') || 'Question'}
                  </SelectItem>
                  <SelectItem value="other">
                    {t('feedback.other') || 'Other'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                {t('feedback.message') || 'Message'} <span className="text-red-500" aria-label="required">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder={t('feedback.messagePlaceholder') || 'Describe your feedback...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="resize-none"
                aria-required="true"
                aria-describedby="message-help"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('feedback.email') || 'Email (Optional)'}</Label>
              <input
                id="email"
                type="email"
                placeholder={t('feedback.emailPlaceholder') || 'your@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('feedback.email') || 'Email (Optional)'}
                aria-describedby="email-help"
              />
              <p id="email-help" className="text-xs text-muted-foreground">
                {t('feedback.emailHelp') || 'We\'ll only use this to respond to your feedback.'}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {sent ? (
            <Button onClick={() => onOpenChange(false)} aria-label={t('common.close') || 'Close'}>
              {t('common.close') || 'Close'}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} aria-label={t('common.cancel') || 'Cancel'}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={!message.trim() || loading} aria-label={t('common.send') || 'Send feedback'}>
                {loading ? (
                  <>
                    <span className="mr-2">{t('common.sending') || 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('common.send') || 'Send'}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

