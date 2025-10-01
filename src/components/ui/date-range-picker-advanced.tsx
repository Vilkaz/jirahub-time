import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type DateRangePreset = 'today' | 'current_week' | 'current_month' | 'custom';

interface DateRangePickerAdvancedProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined, preset: DateRangePreset) => void;
  className?: string;
}

const getPresetRange = (preset: DateRangePreset): DateRange | undefined => {
  const today = new Date();

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'current_week':
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 }),
      };
    case 'current_month':
      return {
        from: startOfMonth(today),
        to: endOfMonth(today),
      };
    case 'custom':
      return undefined;
    default:
      return { from: today, to: today };
  }
};

const presetLabels: Record<DateRangePreset, string> = {
  today: 'Today',
  current_week: 'Current Week',
  current_month: 'Current Month',
  custom: 'Custom',
};

export const DateRangePickerAdvanced = ({
  value,
  onChange,
  className
}: DateRangePickerAdvancedProps) => {
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<DateRangePreset>('current_week');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    value || getPresetRange('current_week')
  );
  const [activeTab, setActiveTab] = React.useState<'presets' | 'custom'>('presets');

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setActiveTab('custom');
      setSelectedPreset(preset);
      return;
    }

    const range = getPresetRange(preset);
    setSelectedPreset(preset);
    setDateRange(range);
    onChange?.(range, preset);
    setOpen(false);
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setSelectedPreset('custom');
      onChange?.(range, 'custom');
      setOpen(false);
    }
  };

  const getDisplayText = () => {
    if (!dateRange?.from) {
      return 'Select date range';
    }

    if (selectedPreset === 'custom' && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }

    if (selectedPreset !== 'custom') {
      return presetLabels[selectedPreset];
    }

    return format(dateRange.from, 'MMM d, yyyy');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('justify-start text-left font-normal', className)}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'presets' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="p-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handlePresetSelect('today')}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handlePresetSelect('current_week')}
            >
              Current Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handlePresetSelect('current_month')}
            >
              Current Month
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="p-0">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleCustomDateSelect}
              numberOfMonths={2}
              defaultMonth={dateRange?.from}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
