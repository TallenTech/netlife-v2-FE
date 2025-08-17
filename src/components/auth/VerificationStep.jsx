import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import LoadingButton from "./LoadingButton";
import { formatCountdown } from "@/lib/errorHandling";

const VerificationStep = ({
  phoneNumber,
  verificationCode,
  setVerificationCode,
  onVerify,
  onResend,
  onEditNumber,
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
        <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
        </div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-900">
          Verify Your Number
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mb-2">
          We've sent a 6-digit code to
        </p>
        <div className="flex flex-col items-center space-y-2">
          <p className="font-semibold text-gray-800 text-sm sm:text-base lg:text-lg break-all">
            {phoneNumber}
          </p>
          <button
            onClick={onEditNumber}
            className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium underline transition-colors duration-200 flex items-center space-x-1"
          >
            {/* <span>✏️</span> */}
            <span>Edit Number</span>
          </button>
        </div>
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
          className={`h-12 sm:h-14 lg:h-16 text-center text-xl sm:text-2xl lg:text-3xl font-bold tracking-[0.5em] sm:tracking-[1em] lg:tracking-[1.5em] transition-colors duration-200 ${verificationCode.length === 6
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
        className={`w-full h-12 sm:h-14 lg:h-16 font-semibold text-base sm:text-lg lg:text-xl rounded-xl mb-4 sm:mb-6 transition-all duration-200 ${verificationCode.length === 6
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

      {/* Contact Us Button */}
      <div className="mt-4 sm:mt-6 text-center">
        <Link
          to="/contact-us"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <span className="mr-2">📞</span>
          Contact Us
        </Link>
      </div>
    </motion.div>
  );
};

export default VerificationStep;
