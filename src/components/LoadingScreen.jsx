import React from "react";
import NetLifeLogo from "@/components/NetLifeLogo";
import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <NetLifeLogo className="w-20 h-20 mx-auto" />
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default LoadingScreen;
