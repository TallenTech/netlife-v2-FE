import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import LoadingButton from "./LoadingButton";
import { formatCountdown } from "@/lib/errorHandling";

const VerificationStep = ({
  phoneNumber,
  verificationCode,
  setVerificationCode,
  onVerify,
  onResend,
  isLoading,
  resendTimer,
  isResendTimerActive,
}) => {
  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (verificationCode.length === 6 && !isLoading.verify) {
      // Add a small delay to ensure the user sees the complete code
      const timer = setTimeout(() => {
        onVerify();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [verificationCode, onVerify, isLoading.verify]);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      <div className="border-2 border-primary/20 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-center text-primary">
        <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
          <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
        </div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-900">
          Verify Your Number
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mb-2">
          We've sent a 6-digit code to
        </p>
        <p className="font-semibold text-gray-800 text-sm sm:text-base lg:text-lg break-all">
          {phoneNumber}
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <label className="text-gray-800 font-medium text-sm sm:text-base lg:text-lg">
          Enter Verification Code
        </label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="_ _ _ _ _ _"
          maxLength="6"
          value={verificationCode}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            setVerificationCode(value);
          }}
          className={`h-12 sm:h-14 lg:h-16 text-center text-xl sm:text-2xl lg:text-3xl font-bold tracking-[0.5em] sm:tracking-[1em] lg:tracking-[1.5em] transition-colors duration-200 ${
            verificationCode.length === 6 
              ? 'border-green-500 bg-green-50' 
              : verificationCode.length > 0 
                ? 'border-primary bg-primary/5' 
                : ''
          }`}
          autoFocus
        />
      </div>

      <LoadingButton
        onClick={onVerify}
        isLoading={isLoading.verify}
        loadingText="Verifying..."
        disabled={verificationCode.length !== 6 || isLoading.verify}
        className={`w-full h-12 sm:h-14 lg:h-16 font-semibold text-base sm:text-lg lg:text-xl rounded-xl mb-4 sm:mb-6 transition-all duration-200 ${
          verificationCode.length === 6
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-primary text-white hover:bg-primary/90'
        }`}
      >
        {verificationCode.length === 6 ? 'Auto-verifying...' : 'Verify Code'}
      </LoadingButton>

      <div className="text-center space-y-2 lg:space-y-3">
        <p className="text-gray-600 text-xs sm:text-sm">Didn't receive the code?</p>
        <button
          onClick={onResend}
          disabled={isResendTimerActive || isLoading.resend}
          className="text-primary font-medium underline disabled:text-gray-400 disabled:no-underline flex items-center justify-center mx-auto text-sm sm:text-base lg:text-lg min-h-[44px] px-2"
        >
          {isLoading.resend && (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-2 animate-spin flex-shrink-0" />
          )}
          <span className="truncate">
            {isResendTimerActive
              ? `Resend in ${formatCountdown(resendTimer)}`
              : isLoading.resend
              ? "Sending..."
              : "Resend Code"}
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default VerificationStep;
