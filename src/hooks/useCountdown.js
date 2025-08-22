import { useState, useEffect, useRef } from "react";

export const useCountdown = (initialSeconds) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const start = (count = initialSeconds) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setSeconds(count);

    if (count > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }
  };

  const isActive = seconds > 0;

  return { seconds, start, isActive };
};
