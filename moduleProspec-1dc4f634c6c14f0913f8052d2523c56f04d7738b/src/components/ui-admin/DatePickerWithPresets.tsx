// src/components/ui/DatePickerWithPresets.tsx

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui-admin/button"
import { Calendar } from "@/components/ui-admin/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui-admin/popover"

interface DatePickerWithPresetsProps {
  className?: string
  selectedDate: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  onPresetSelect: (preset: string) => void
}

export function DatePickerWithPresets({
  className,
  selectedDate,
  onDateChange,
  onPresetSelect,
}: DatePickerWithPresetsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal h-11",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate?.from ? (
            selectedDate.to ? (
              <>
                {format(selectedDate.from, "d LLL y", { locale: fr })} -{" "}
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
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="end">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onPresetSelect('week')}>Cette semaine</Button>
            <Button variant="ghost" size="sm" onClick={() => onPresetSelect('month')}>Ce mois</Button>
            <Button variant="ghost" size="sm" onClick={() => onPresetSelect('year')}>Cette année</Button>
        </div>
        <div className="rounded-md border">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDate?.from}
            selected={selectedDate}
            onSelect={onDateChange}
            numberOfMonths={2}
            locale={fr}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}