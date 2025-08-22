import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

const CircularProgress = ({ progress }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className="text-primary transition-all duration-300 ease-linear"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-primary">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

export const DownloadProgressModal = ({ isOpen, progress, statusMessage }) => {
  const isComplete = progress >= 100;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isComplete ? "Export Complete" : "Exporting Your Data"}
          </DialogTitle>
          {!isComplete && (
            <DialogDescription className="text-center">
              Please wait, this may take a moment...
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="w-32 h-32 flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 className="w-24 h-24 text-green-500" />
            ) : (
              <CircularProgress progress={progress} />
            )}
          </div>
          <p className="text-center text-sm text-gray-600 min-h-[40px] px-4">
            {statusMessage}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
