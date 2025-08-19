import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [activePicker, setActivePicker] = useState("month"); // month, day, year

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

  // Improved days calculation with proper leap year handling
  const daysInMonth = useMemo(() => {
    if (!month || !year || year.length < 4) {
      return 31;
    }
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Handle February and leap years
    if (monthNum === 2) {
      const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
      return isLeapYear ? 29 : 28;
    }

    // Handle months with 30 days
    if ([4, 6, 9, 11].includes(monthNum)) {
      return 30;
    }

    // All other months have 31 days
    return 31;
  }, [month, year]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = (i + 1).toString().padStart(2, "0");
      return { value: dayNum, name: dayNum };
    });
  }, [daysInMonth]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100; // Allow up to 100 years back
    const endYear = maxAllowedYear;

    return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
      const yearNum = endYear - i;
      return { value: yearNum.toString(), name: yearNum.toString() };
    });
  }, [maxAllowedYear]);

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

  const handleMobileSelect = (type, value) => {
    switch (type) {
      case "month":
        handleMonthChange(value);
        setActivePicker("day");
        break;
      case "day":
        handleDayChange(value);
        setActivePicker("year");
        break;
      case "year":
        setYear(value);
        notifyParent(day, month, value);
        setShowMobileModal(false);
        setActivePicker("month");
        break;
    }
  };

  const getDisplayValue = () => {
    const monthName = months.find(m => m.value === month)?.name || "";
    const dayDisplay = day || "";
    const yearDisplay = year || "";

    if (monthName && dayDisplay && yearDisplay) {
      return `${monthName} ${dayDisplay}, ${yearDisplay}`;
    }
    return "Select your birth date";
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-2 lg:gap-3">
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

      {/* Mobile View */}
      <button
        type="button"
        onClick={() => setShowMobileModal(true)}
        className="md:hidden w-full h-11 md:h-12 px-3 py-2 text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors hover:border-gray-400"
      >
        <div className="flex items-center justify-between">
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {getDisplayValue()}
          </span>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </button>

      {/* Mobile Slide-up Modal */}
      <AnimatePresence>
        {showMobileModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileModal(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Select Birth Date</h3>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="px-4 py-2 bg-gray-50">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded ${activePicker === 'month' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    Month
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2 py-1 rounded ${activePicker === 'day' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    Day
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2 py-1 rounded ${activePicker === 'year' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    Year
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {activePicker === "month" && (
                  <div className="p-4">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Select Month</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {months.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => handleMobileSelect("month", m.value)}
                          className={`p-4 text-left border rounded-lg transition-colors ${month === m.value
                            ? "bg-primary/10 text-primary border-primary"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activePicker === "day" && (
                  <div className="p-4">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Select Day</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {dayOptions.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => handleMobileSelect("day", d.value)}
                          className={`p-3 text-center border rounded-lg transition-colors ${day === d.value
                            ? "bg-primary/10 text-primary border-primary"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activePicker === "year" && (
                  <div className="p-4">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Select Year</h4>
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                      {yearOptions.map((y) => (
                        <button
                          key={y.value}
                          onClick={() => handleMobileSelect("year", y.value)}
                          className={`p-3 text-center border rounded-lg transition-colors ${year === y.value
                            ? "bg-primary/10 text-primary border-primary"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                          {y.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setActivePicker("month");
                      setShowMobileModal(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowMobileModal(false)}
                    className="flex-1"
                    disabled={!day || !month || !year}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
