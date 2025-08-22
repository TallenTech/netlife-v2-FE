import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { whatsappAuth } from "@/services/whatsappService";
import { supabase } from "@/lib/supabase";
import { useCountdown } from "./useCountdown";
import {
  validatePhoneNumber,
  formatPhoneNumberForDisplay,
} from "@/lib/phoneUtils";
import { handleError } from "@/lib/errorHandling";

export const useWhatsAppAuth = (onSuccess) => {
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [activeTab, setActiveTab] = useState("join");
  const [isLoading, setIsLoading] = useState({
    send: false,
    verify: false,
    resend: false,
  });
  const [networkStatus, setNetworkStatus] = useState("online");
  const { toast } = useToast();
  const {
    seconds: resendTimer,
    start: startResendTimer,
    isActive: isResendTimerActive,
  } = useCountdown(60);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus("online");
    const handleOffline = () => setNetworkStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleApiError = (error, operation) => {
    if (networkStatus === "offline")
      return handleError(toast, "NETWORK_ERROR", "You appear to be offline.");
    handleError(toast, error.code, error.message);
  };

  const handlePhoneSubmit = async () => {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid)
      return handleError(toast, "INVALID_PHONE_NUMBER", validation.error);
    setIsLoading((prev) => ({ ...prev, send: true }));
    try {
      await whatsappAuth.sendCode(validation.cleanedNumber);
      setStep("verify");
      startResendTimer();
      toast({
        title: "Code Sent!",
        description: `Code sent to ${formatPhoneNumberForDisplay(
          validation.cleanedNumber
        )}`,
      });
    } catch (error) {
      handleApiError(error, "sendCode");
    } finally {
      setIsLoading((prev) => ({ ...prev, send: false }));
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setIsLoading((prev) => ({ ...prev, verify: false }));
      return;
    }

    setIsLoading((prev) => ({ ...prev, verify: true }));
    try {
      const result = await whatsappAuth.verifyCode(
        phoneNumber,
        verificationCode
      );
      if (result.success && onSuccess) {
        await onSuccess(result.session.user, activeTab === "login");
      } else {
        setVerificationCode("");
        setIsLoading((prev) => ({ ...prev, verify: false }));
      }
    } catch (error) {
      // Check if the error occurred but we actually have a valid session
      // This can happen when Supabase returns an error but authentication succeeds
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && session.user && onSuccess) {
        // Authentication actually succeeded despite the error
        console.log("Authentication succeeded despite error:", error);
        await onSuccess(session.user, activeTab === "login");
      } else {
        // Genuine error - just reset the form, no toast
        console.log("Authentication failed:", error);
        setVerificationCode("");
        setIsLoading((prev) => ({ ...prev, verify: false }));
      }
    }
  };

  const handleResendCode = async () => {
    if (isResendTimerActive || isLoading.resend) return;
    setIsLoading((prev) => ({ ...prev, resend: true }));
    try {
      await whatsappAuth.sendCode(phoneNumber);
      startResendTimer();
    } catch (error) {
      handleApiError(error, "resendCode");
    } finally {
      setIsLoading((prev) => ({ ...prev, resend: false }));
    }
  };

  const goBackToPhoneStep = () => {
    setStep("phone");
    setVerificationCode("");
  };

  return {
    step,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    activeTab,
    setActiveTab,
    isLoading,
    networkStatus,
    resendTimer,
    isResendTimerActive,
    handlePhoneSubmit,
    handleVerifyCode,
    handleResendCode,
    goBackToPhoneStep,
  };
};
