import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLocale } from '../hooks/useLocale';

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onSelect: (from: Date | undefined, to: Date | undefined) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ from, to, onSelect }) => {
  const { t } = useLocale();
  
  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[150px] justify-start text-left font-normal',
              !from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {from ? format(from, 'PPP') : <span>{t('common.from')}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={from}
            onSelect={(date) => onSelect(date, to)}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[150px] justify-start text-left font-normal',
              !to && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {to ? format(to, 'PPP') : <span>{t('common.to')}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={to}
            onSelect={(date) => onSelect(from, date)}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
