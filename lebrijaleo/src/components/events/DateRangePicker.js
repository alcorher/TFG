"use client"

import * as React from "react"
import { addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"

export function DateRangePicker({ className, onRangeChange }) {
  const [date, setDate] = React.useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  })

  React.useEffect(() => {
    if (onRangeChange) {
      onRangeChange(date);
    }
  }, [date, onRangeChange]);

  return (
    <div className={`grid gap-2 ${className}`}>
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={setDate}
        numberOfMonths={1}
        locale={es}
        className="rounded-md border-none"
      />
    </div>
  )
}