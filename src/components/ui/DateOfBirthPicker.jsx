import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const months = [
  { value: "01", name: "January" },
  { value: "02", name: "February" },
  { value: "03", name: "March" },
  { value: "04", name: "April" },
  { value: "05", name: "May" },
  { value: "06", name: "June" },
  { value: "07", name: "July" },
  { value: "08", name: "August" },
  { value: "09", name: "September" },
  { value: "10", name: "October" },
  { value: "11", name: "November" },
  { value: "12", name: "December" },
];

export const DateOfBirthPicker = ({ value, onChange, maxYear }) => {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const maxAllowedYear = maxYear || new Date().getFullYear() - 15;

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setYear(y);
      setMonth(m);
      setDay(d);
    } else if (!value) {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  const daysInMonth = useMemo(() => {
    if (!month || !year || year.length < 4) {
      return 31;
    }
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  }, [month, year]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = (i + 1).toString().padStart(2, "0");
      return { value: dayNum, name: dayNum };
    });
  }, [daysInMonth]);

  const notifyParent = useCallback(
    (d, m, y) => {
      if (d && m && y && y.length === 4) {
        const fullDate = `${y}-${m}-${d}`;
        const birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        const today = new Date();
        const cutoffDate = new Date(
          today.getFullYear() - 15,
          today.getMonth(),
          today.getDate()
        );

        if (birthDate <= cutoffDate) {
          onChange(fullDate);
        } else {
          onChange("");
        }
      } else {
        onChange("");
      }
    },
    [onChange]
  );

  const handleMonthChange = (newMonth) => {
    let currentDay = day;
    const newDaysInMonth = year
      ? new Date(parseInt(year), parseInt(newMonth), 0).getDate()
      : 31;
    if (day && parseInt(day) > newDaysInMonth) {
      currentDay = "";
      setDay("");
    }
    setMonth(newMonth);
    notifyParent(currentDay, newMonth, year);
  };

  const handleDayChange = (newDay) => {
    setDay(newDay);
    notifyParent(newDay, month, year);
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value.replace(/[^0-9]/g, "");
    if (newYear.length <= 4) {
      let currentDay = day;
      const newDaysInMonth = month
        ? new Date(parseInt(newYear), parseInt(month), 0).getDate()
        : 31;
      if (day && parseInt(day) > newDaysInMonth) {
        currentDay = "";
        setDay("");
      }
      setYear(newYear);
      notifyParent(currentDay, month, newYear);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 md-gap-3">
      <Select value={month} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-11 md:h-12 text-base">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={day} onValueChange={handleDayChange} disabled={!month}>
        <SelectTrigger className="h-11 md:h-12 text-base">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {dayOptions.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Year"
        value={year}
        onChange={handleYearChange}
        maxLength="4"
        className="h-11 md:h-12 text-base"
        type="number"
        max={maxAllowedYear}
      />
    </div>
  );
};
