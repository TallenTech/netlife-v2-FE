import React, { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import InputMask from "react-input-mask";
import { MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import LoadingButton from "./LoadingButton";
import {
  isPhoneNumberComplete,
  getPhoneNumberMask,
  normalizePhoneNumberInput,
} from "@/lib/phoneUtils";

const MaskedInput = forwardRef((props, ref) => <Input {...props} ref={ref} />);
MaskedInput.displayName = "MaskedInput";

const AuthForm = ({
  isLogin,
  phoneNumber,
  setPhoneNumber,
  onSubmit,
  isLoading,
  validatePhone,
}) => {
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (e) => {
    let value = normalizePhoneNumberInput(e.target.value);
    setPhoneNumber(value);

    if (phoneError) {
      setPhoneError("");
    }

    if (isPhoneNumberComplete(value)) {
      const validation = validatePhone(value);
      if (!validation.isValid) {
        setPhoneError(validation.error);
      }
    }
  };

  const handleFormSubmit = () => {
    const validation = validatePhone(phoneNumber);
    if (!validation.isValid) {
      setPhoneError(validation.error);
      return;
    }
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col"
    >
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <label className="text-gray-800 font-medium text-sm sm:text-base">
          WhatsApp Phone Number
        </label>
        <div className="space-y-2">
          <InputMask
            mask={getPhoneNumberMask(phoneNumber)}
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={isLoading}
          >
            {/* We now use our new MaskedInput component here */}
            {(inputProps) => (
              <MaskedInput
                {...inputProps}
                type="tel"
                placeholder="+256 XXX XXX XXX"
                className={`text-base sm:text-lg h-12 sm:h-14 ${
                  phoneError ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
            )}
          </InputMask>
          {phoneError && (
            <p className="text-red-500 text-xs sm:text-sm flex items-center">
              <span className="mr-1 flex-shrink-0">⚠️</span>
              <span className="min-w-0">{phoneError}</span>
            </p>
          )}
          <p className="text-gray-500 text-xs">
            Enter your Uganda phone number (e.g., +256 701 234 567)
          </p>
        </div>
      </div>

      <LoadingButton
        onClick={handleFormSubmit}
        isLoading={isLoading}
        loadingText="Sending..."
        disabled={
          isLoading ||
          !phoneNumber ||
          !isPhoneNumberComplete(phoneNumber) ||
          !!phoneError
        }
        className="w-full h-12 sm:h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-base sm:text-lg rounded-xl mb-4 sm:mb-6"
      >
        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        <span className="truncate">{isLogin ? "Login with WhatsApp" : "Join with WhatsApp"}</span>
      </LoadingButton>

      <div className="text-center space-y-2">
        <p className="text-gray-600 text-xs sm:text-sm">No passwords. No emails.</p>
        <p className="text-gray-500 text-xs leading-relaxed px-2">
          By proceeding, you accept our{" "}
          <Link to="/terms-of-service" className="text-primary underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy-policy" className="text-primary underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default AuthForm;
