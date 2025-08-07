import React from "react";
import { ChevronLeft } from "lucide-react";
import NetLifeLogo from "@/components/NetLifeLogo";

const AuthLayout = ({ onBack, children }) => {
  return (
    <>
      <div className="lg:hidden mobile-container bg-white">
        <div className="h-screen flex flex-col">
          <header className="flex items-center justify-between p-6 pt-12">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <NetLifeLogo className="w-12 h-12" />
          </header>
          <main className="flex-1 flex flex-col px-6 pb-6">{children}</main>
        </div>
      </div>

      <div className="hidden lg:block min-h-screen bg-gray-50">
        <header className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <NetLifeLogo className="w-14 h-14" />
          </div>
        </header>
        <main className="flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default AuthLayout;
