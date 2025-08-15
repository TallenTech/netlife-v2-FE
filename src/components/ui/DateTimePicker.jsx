import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DateTimePicker = ({ 
  value, 
  onChange, 
  label = "Select Date & Time",
  placeholder = "Choose date and time",
  required = false,
  error = null,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [step, setStep] = useState('date'); // 'date' or 'time'
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Check if mobile device and handle orientation changes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (isMobile && isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollY}px`;
      
      // Prevent touch events on body
      const preventTouch = (e) => {
        if (e.target === document.body) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', preventTouch, { passive: false });
      
      return () => {
        // Restore body scroll
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
        
        // Remove touch event listener
        document.removeEventListener('touchmove', preventTouch);
      };
    }
  }, [isMobile, isOpen]);

  // Initialize from value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setSelectedTime({
        hour: date.getHours(),
        minute: date.getMinutes()
      });
    }
  }, [value]);

  // Close popover when clicking outside or pressing Escape (desktop only)
  useEffect(() => {
    if (!isMobile && isOpen) {
      const handleClickOutside = (event) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target) &&
            triggerRef.current && !triggerRef.current.contains(event.target)) {
          setIsOpen(false);
          setStep('date');
        }
      };

      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          setStep('date');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isMobile]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    const minDate = new Date(today.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
    const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isDisabled = date < minDate || date > maxDate;
      
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      });
    }
    
    return days;
  };

  // Quick date options
  const getQuickDateOptions = () => {
    const now = new Date();
    const options = [];
    
    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    options.push({
      label: 'Tomorrow Morning',
      date: tomorrow,
      time: { hour: 9, minute: 0 }
    });

    // Next week
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);
    options.push({
      label: 'Next Week',
      date: nextWeek,
      time: { hour: 10, minute: 0 }
    });

    // In 3 days
    const threeDays = new Date(now);
    threeDays.setDate(now.getDate() + 3);
    threeDays.setHours(14, 0, 0, 0);
    options.push({
      label: 'In 3 Days',
      date: threeDays,
      time: { hour: 14, minute: 0 }
    });

    return options;
  };

  // Time slots
  const getTimeSlots = () => {
    return [
      { label: 'Morning', hours: [8, 9, 10, 11], icon: '🌅' },
      { label: 'Afternoon', hours: [12, 13, 14, 15, 16], icon: '☀️' },
      { label: 'Evening', hours: [17, 18, 19, 20], icon: '🌆' }
    ];
  };

  const handleDateSelect = (day) => {
    if (day.isDisabled) return;
    setSelectedDate(day.date);
    setStep('time');
  };

  const handleTimeSelect = (hour, minute = 0) => {
    const time = { hour, minute };
    setSelectedTime(time);
    
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(hour, minute, 0, 0);
      onChange(finalDate.toISOString());
      setIsOpen(false);
      setStep('date');
    }
  };

  const handleQuickSelect = (option) => {
    setSelectedDate(option.date);
    setSelectedTime(option.time);
    const finalDate = new Date(option.date);
    finalDate.setHours(option.time.hour, option.time.minute, 0, 0);
    onChange(finalDate.toISOString());
    setIsOpen(false);
    setStep('date');
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const date = new Date(value);
    
    // Check if mobile for shorter format
    const isSmallScreen = window.innerWidth < 400;
    
    if (isSmallScreen) {
      // Shorter format for small screens
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${dateStr} at ${timeStr}`;
    } else {
      // Full format for larger screens
      const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${dateStr} at ${timeStr}`;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label className="text-base font-semibold text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Trigger Button */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full h-14 sm:h-16 px-4 bg-gray-50 border-2 rounded-xl text-left flex items-center justify-between transition-all duration-200 touch-manipulation",
            "hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 active:bg-gray-100",
            error ? "border-red-300 bg-red-50" : "border-gray-200",
            !value && "text-gray-500"
          )}
        >
          <span className="flex items-center gap-3 flex-1 min-w-0">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
            <span className="text-base sm:text-lg truncate">
              {value ? formatDisplayValue() : placeholder}
            </span>
          </span>
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
        </button>

        {/* Desktop Popover */}
        {!isMobile && (
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 min-w-[400px] max-w-[500px] datetime-picker-popover"
                style={{
                  // Adjust position if it would go off-screen
                  left: triggerRef.current && (triggerRef.current.getBoundingClientRect().left + 400 > window.innerWidth) ? 'auto' : '0',
                  right: triggerRef.current && (triggerRef.current.getBoundingClientRect().left + 400 > window.innerWidth) ? '0' : 'auto'
                }}
              >
                {/* Desktop Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {step === 'time' && (
                      <button
                        onClick={() => setStep('date')}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                    <h3 className="text-lg font-semibold">
                      {step === 'date' ? 'Select Date' : 'Select Time'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setStep('date');
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Desktop Content */}
                <div className="max-h-[500px] overflow-y-auto">
                  {step === 'date' ? (
                    <DesktopDateStep
                      currentMonth={currentMonth}
                      setCurrentMonth={setCurrentMonth}
                      generateCalendarDays={generateCalendarDays}
                      handleDateSelect={handleDateSelect}
                      getQuickDateOptions={getQuickDateOptions}
                      handleQuickSelect={handleQuickSelect}
                      monthNames={monthNames}
                    />
                  ) : (
                    <DesktopTimeStep
                      getTimeSlots={getTimeSlots}
                      handleTimeSelect={handleTimeSelect}
                      selectedTime={selectedTime}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
          {error}
        </p>
      )}

      {/* Mobile Modal */}
      {isMobile && (
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => {
                  setIsOpen(false);
                  setStep('date');
                }}
                onTouchMove={(e) => {
                  // Prevent background scroll when touching backdrop
                  e.preventDefault();
                }}
              />

              {/* Modal */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 overflow-hidden safe-area-inset-bottom flex flex-col"
                style={{
                  maxHeight: window.innerHeight < 600 ? '95vh' : '90vh' // Adjust for very small screens
                }}
                onTouchMove={(e) => {
                  // Allow touch events within modal
                  e.stopPropagation();
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {step === 'time' && (
                      <button
                        onClick={() => setStep('date')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                        aria-label="Go back to date selection"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {step === 'date' ? 'Select Date' : 'Select Time'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setStep('date');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                    aria-label="Close date picker"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div 
                  className="flex-1 overflow-y-auto overscroll-contain touch-pan-y"
                  style={{
                    WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
                  }}
                  onTouchStart={(e) => {
                    // Mark the start of touch for proper scroll handling
                    e.currentTarget.dataset.touchStart = e.touches[0].clientY;
                  }}
                  onTouchMove={(e) => {
                    const container = e.currentTarget;
                    const touchStart = parseFloat(container.dataset.touchStart || '0');
                    const touchCurrent = e.touches[0].clientY;
                    const scrollTop = container.scrollTop;
                    const scrollHeight = container.scrollHeight;
                    const clientHeight = container.clientHeight;
                    
                    // Allow scrolling within bounds
                    if (
                      (scrollTop === 0 && touchCurrent > touchStart) || // At top, scrolling down
                      (scrollTop + clientHeight >= scrollHeight && touchCurrent < touchStart) // At bottom, scrolling up
                    ) {
                      e.preventDefault(); // Prevent overscroll
                    }
                    
                    e.stopPropagation(); // Don't let parent handle this
                  }}
                >
                  {step === 'date' ? (
                    <MobileDateStep
                      currentMonth={currentMonth}
                      setCurrentMonth={setCurrentMonth}
                      generateCalendarDays={generateCalendarDays}
                      handleDateSelect={handleDateSelect}
                      getQuickDateOptions={getQuickDateOptions}
                      handleQuickSelect={handleQuickSelect}
                      monthNames={monthNames}
                    />
                  ) : (
                    <MobileTimeStep
                      getTimeSlots={getTimeSlots}
                      handleTimeSelect={handleTimeSelect}
                      selectedTime={selectedTime}
                    />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

// Desktop Date Selection Step
const DesktopDateStep = ({ 
  currentMonth, 
  setCurrentMonth, 
  generateCalendarDays, 
  handleDateSelect, 
  getQuickDateOptions, 
  handleQuickSelect,
  monthNames 
}) => {
  const days = generateCalendarDays();
  const quickOptions = getQuickDateOptions();

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Quick Options - Horizontal layout for desktop */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 text-sm">Quick Select</h4>
        <div className="flex gap-2">
          {quickOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleQuickSelect(option)}
              className="flex-1 p-2 bg-primary/5 hover:bg-primary/10 rounded-lg text-center transition-colors border border-primary/20"
            >
              <div className="font-medium text-primary text-sm">{option.label}</div>
              <div className="text-xs text-gray-600 mt-1">
                {option.date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} at {option.time.hour}:00
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 text-sm">Or Choose Date</h4>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h5 className="font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h5>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(day)}
              disabled={day.isDisabled}
              className={cn(
                "p-1 text-center text-sm rounded-md transition-all duration-200 min-h-[32px]",
                !day.isCurrentMonth && "text-gray-300",
                day.isCurrentMonth && !day.isDisabled && "text-gray-900 hover:bg-gray-100",
                day.isToday && "bg-blue-100 text-blue-600 font-semibold",
                day.isSelected && "bg-primary text-white font-semibold",
                day.isDisabled && "text-gray-300 cursor-not-allowed opacity-50"
              )}
            >
              {day.day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Desktop Time Selection Step
const DesktopTimeStep = ({ getTimeSlots, handleTimeSelect, selectedTime }) => {
  const timeSlots = getTimeSlots();

  return (
    <div className="p-4 space-y-4">
      {timeSlots.map((slot, index) => (
        <div key={index} className="space-y-2">
          <h4 className="font-medium text-gray-700 flex items-center gap-2 text-sm">
            <span>{slot.icon}</span>
            {slot.label}
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {slot.hours.map(hour => (
              <button
                key={hour}
                onClick={() => handleTimeSelect(hour, 0)}
                className={cn(
                  "p-2 rounded-lg text-center transition-all duration-200 border",
                  selectedTime?.hour === hour
                    ? "bg-primary text-white border-primary"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="font-semibold text-sm">
                  {hour === 12 ? '12' : hour > 12 ? hour - 12 : hour}:00
                </div>
                <div className="text-xs opacity-75">
                  {hour < 12 ? 'AM' : 'PM'}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Mobile Date Selection Step
const MobileDateStep = ({ 
  currentMonth, 
  setCurrentMonth, 
  generateCalendarDays, 
  handleDateSelect, 
  getQuickDateOptions, 
  handleQuickSelect,
  monthNames 
}) => {
  const days = generateCalendarDays();
  const quickOptions = getQuickDateOptions();

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 pb-6">
      {/* Quick Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 text-base">Quick Select</h4>
        <div className="grid gap-2 sm:gap-3">
          {quickOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleQuickSelect(option)}
              className="p-3 sm:p-4 bg-primary/5 hover:bg-primary/10 active:bg-primary/15 rounded-xl text-left transition-colors border border-primary/20 touch-manipulation min-h-[60px] flex flex-col justify-center"
            >
              <span className="font-semibold text-primary text-base sm:text-lg">{option.label}</span>
              <div className="text-sm text-gray-600 mt-1">
                {option.date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })} at {option.time.hour}:00
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700 text-base">Or Choose Date</h4>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-3 hover:bg-gray-200 active:bg-gray-300 rounded-full transition-colors touch-manipulation"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h5 className="font-semibold text-base sm:text-lg text-gray-900 px-2 text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h5>
          <button
            onClick={() => navigateMonth(1)}
            className="p-3 hover:bg-gray-200 active:bg-gray-300 rounded-full transition-colors touch-manipulation"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(day)}
                disabled={day.isDisabled}
                className={cn(
                  "p-2 sm:p-3 text-center text-sm sm:text-base rounded-lg transition-all duration-200 min-h-[44px] sm:min-h-[48px] touch-manipulation font-medium",
                  !day.isCurrentMonth && "text-gray-300",
                  day.isCurrentMonth && !day.isDisabled && "text-gray-900 hover:bg-gray-100 active:bg-gray-200",
                  day.isToday && !day.isSelected && "bg-blue-100 text-blue-700 font-bold ring-2 ring-blue-200",
                  day.isSelected && "bg-primary text-white font-bold shadow-lg scale-105",
                  day.isDisabled && "text-gray-300 cursor-not-allowed opacity-40"
                )}
              >
                {day.day}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Time Selection Step
const MobileTimeStep = ({ getTimeSlots, handleTimeSelect, selectedTime }) => {
  const timeSlots = getTimeSlots();

  return (
    <div className="p-3 sm:p-4 space-y-5 sm:space-y-6 pb-6">
      {timeSlots.map((slot, index) => (
        <div key={index} className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-3 text-base sm:text-lg">
            <span className="text-xl sm:text-2xl">{slot.icon}</span>
            <span>{slot.label}</span>
            <span className="text-sm text-gray-500 font-normal">
              ({slot.hours.length} slots)
            </span>
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {slot.hours.map(hour => (
              <button
                key={hour}
                onClick={() => handleTimeSelect(hour, 0)}
                className={cn(
                  "p-3 sm:p-4 rounded-xl text-center transition-all duration-200 border-2 touch-manipulation min-h-[60px] sm:min-h-[70px] flex flex-col justify-center",
                  selectedTime?.hour === hour
                    ? "bg-primary text-white border-primary shadow-lg scale-105 font-bold"
                    : "bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border-gray-200 hover:border-gray-300 active:border-gray-400"
                )}
              >
                <div className="font-bold text-base sm:text-lg">
                  {hour === 12 ? '12' : hour > 12 ? hour - 12 : hour}:00
                </div>
                <div className="text-xs sm:text-sm opacity-75 mt-1">
                  {hour < 12 ? 'AM' : 'PM'}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      
      {/* Bottom spacing for safe area */}
      <div className="h-4"></div>
    </div>
  );
};

export default DateTimePicker;