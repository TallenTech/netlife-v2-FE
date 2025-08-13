import React from "react";
import { ChevronLeft } from "lucide-react";

const AuthLayout = ({ onBack, children }) => {
  return (
    <>
      <div className="lg:hidden mobile-container bg-white">
        <div className="min-h-screen flex flex-col pb-safe-bottom auth-container">
          <header className="flex items-center p-4 sm:p-6 pt-safe-top">
            <button
              onClick={onBack}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </header>
          <main className="flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 min-h-0 auth-form">{children}</main>
        </div>
      </div>

      <div className="hidden lg:block min-h-screen bg-gray-50">
        <header className="w-full px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
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
