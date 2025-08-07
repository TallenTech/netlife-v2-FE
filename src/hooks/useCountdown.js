import { useState, useEffect, useRef } from "react";

export const useCountdown = (initialSeconds) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const start = (count = initialSeconds) => {
    clearInterval(intervalRef.current);
    setSeconds(count);

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isActive = seconds > 0;

  return { seconds, start, isActive };
};
