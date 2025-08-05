import { cn } from '@/lib/utils';
import React from 'react';

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-white/20',
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-gradient-to-r from-[#6041B0] to-[#1BDEDA] transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
));
Progress.displayName = 'Progress';

export { Progress };