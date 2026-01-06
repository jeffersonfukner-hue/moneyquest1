import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { format, parse, isValid, setMonth, setYear, Locale } from "date-fns";
import { ptBR, enUS, es, pt } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface DatePickerInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
}

const localeMap: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': es,
  'pt-PT': pt,
};

const dateFormatMap: Record<string, string> = {
  'pt-BR': 'dd/MM/yyyy',
  'en-US': 'MM/dd/yyyy',
  'es-ES': 'dd/MM/yyyy',
  'pt-PT': 'dd/MM/yyyy',
};

const getMonthsForLocale = (locale: Locale) => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), 'MMMM', { locale }),
  }));
};

export function DatePickerInput({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: DatePickerInputProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const locale = localeMap[language] || ptBR;
  const dateFormat = dateFormatMap[language] || 'dd/MM/yyyy';
  
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [displayMonth, setDisplayMonth] = useState(value || new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with selected date
  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, dateFormat));
      setDisplayMonth(value);
    }
  }, [value, dateFormat]);

  // Handle typed input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    
    // Try to parse the date
    const parsed = parse(raw, dateFormat, new Date());
    if (isValid(parsed) && raw.length === 10) {
      onChange(parsed);
      setDisplayMonth(parsed);
    }
  };

  // Handle input blur - validate and format
  const handleInputBlur = () => {
    if (!inputValue.trim()) {
      onChange(undefined);
      return;
    }
    
    const parsed = parse(inputValue, dateFormat, new Date());
    if (isValid(parsed)) {
      onChange(parsed);
      setInputValue(format(parsed, dateFormat));
    } else if (value) {
      // Revert to previous valid value
      setInputValue(format(value, dateFormat));
    } else {
      setInputValue('');
    }
  };

  // Handle calendar selection
  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) {
      setInputValue(format(date, dateFormat));
    }
    setOpen(false);
  };

  // Handle month/year change
  const handleMonthChange = (month: string) => {
    const newDate = setMonth(displayMonth, parseInt(month));
    setDisplayMonth(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(displayMonth, parseInt(year));
    setDisplayMonth(newDate);
  };

  // Get months for current locale
  const months = getMonthsForLocale(locale);

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder || dateFormat.toLowerCase()}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="pr-10 min-h-[48px]"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </div>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            {/* Month and Year selectors */}
            <div className="flex gap-2">
              <Select
                value={displayMonth.getMonth().toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={displayMonth.getFullYear().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Calendar */}
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleSelect}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              locale={locale}
              disabled={disabled}
              showOutsideDays={false}
              className="pointer-events-auto"
              classNames={{
                months: "flex flex-col",
                month: "space-y-2",
                caption: "hidden", // Hide default caption since we have custom selectors
                nav: "hidden", // Hide default nav
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-1",
                cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
            
            {/* Quick actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleSelect(new Date())}
              >
                {t('transactions.today', 'Hoje')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
