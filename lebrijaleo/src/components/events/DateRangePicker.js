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
        classNames={{
          
          day_selected:
            "bg-lemon-icing text-midnight-blue hover:bg-lemon-icing hover:text-midnight-blue focus:bg-lemon-icing focus:text-midnight-blue",
          day_today: "bg-nimbus-cloud/20 text-midnight-blue font-bold",
          day_range_middle:
            "aria-selected:bg-lemon-icing/40 aria-selected:text-midnight-blue",
        }}
      />
    </div>
  )
}