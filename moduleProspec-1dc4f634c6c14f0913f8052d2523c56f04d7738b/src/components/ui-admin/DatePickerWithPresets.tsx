// src/components/ui/DatePickerWithPresets.tsx
import React, { useEffect, useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui-admin/button";
import { Calendar } from "@/components/ui-admin/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui-admin/popover";

interface DatePickerWithPresetsProps {
  className?: string;
  selectedDate: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onPresetSelect: (preset: string) => void;
}

export function DatePickerWithPresets({
  className,
  selectedDate,
  onDateChange,
  onPresetSelect,
}: DatePickerWithPresetsProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePresetClick = (preset: string) => {
    // votre logique existante…
    setActivePreset(preset);
    onPresetSelect(preset);
  };

  useEffect(() => {
    // votre effet existant…
  }, [selectedDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            "w-[280px] h-11 justify-start text-left font-medium",
            "bg-white hover:bg-gray-50",
            !selectedDate && "text-gray-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          {selectedDate?.from ? (
            selectedDate.to ? (
              <>
                {format(selectedDate.from, "d LLL y", { locale: fr })} –{" "}
                {format(selectedDate.to, "d LLL y", { locale: fr })}
              </>
            ) : (
              format(selectedDate.from, "d LLL y", { locale: fr })
            )
          ) : (
            <span>Choisir une période</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className={cn(
          "flex flex-col w-[360px] space-y-4",
          "p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
        )}
      >
        {/* Presets */}
        <div className="flex items-center justify-start space-x-2">
          {[
            { key: "week", label: "Cette semaine" },
            { key: "month", label: "Ce mois" },
            { key: "year", label: "Cette année" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={activePreset === key ? "default" : "ghost"}
              onClick={() => handlePresetClick(key)}
              className={cn(
                "px-3 py-1",
                activePreset === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100"
              )}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Calendar */}
        <div className="rounded-md border border-gray-100 bg-sky-100">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDate?.from}
            selected={selectedDate}
            onSelect={onDateChange}
            numberOfMonths={1}
            locale={fr}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
