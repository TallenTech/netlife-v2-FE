import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useUpdatePhoneNumber,
  useVerifyPhoneUpdate,
} from "@/hooks/useSettingsQueries";

export const PhoneNumberManager = ({ user, refreshAuthAndProfiles }) => {
  const { toast } = useToast();
  const [phoneUpdateStep, setPhoneUpdateStep] = useState("idle");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  const { mutateAsync: initiatePhoneUpdate, isLoading: isSendingOtp } =
    useUpdatePhoneNumber();
  const { mutateAsync: verifyPhoneUpdate, isLoading: isVerifyingOtp } =
    useVerifyPhoneUpdate();

  const handleInitiatePhoneUpdate = async () => {
    if (
      !newPhoneNumber ||
      !newPhoneNumber.startsWith("+") ||
      newPhoneNumber.length < 10
    ) {
      toast({
        title: "Invalid Phone Number",
        description:
          "Please enter a valid number in international format (e.g., +2567...).",
        variant: "destructive",
      });
      return;
    }
    try {
      const { success, error } = await initiatePhoneUpdate(newPhoneNumber);
      if (!success) throw error;
      setPhoneUpdateStep("verifying");
      toast({
        title: "Verification Code Sent",
        description: "Check your new WhatsApp for an OTP.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyPhoneUpdate = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { success, error } = await verifyPhoneUpdate({
        phone: newPhoneNumber,
        token: phoneOtp,
      });
      if (!success) throw error;
      await refreshAuthAndProfiles();
      setPhoneUpdateStep("idle");
      setNewPhoneNumber("");
      setPhoneOtp("");
      toast({
        title: "Success!",
        description: "Your phone number has been updated.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div>
        <label className="text-sm font-medium text-gray-700">
          WhatsApp Number
        </label>
        <div className="flex items-center space-x-2">
          <Input value={user?.phone || "No number on account"} disabled />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPhoneUpdateStep(
                phoneUpdateStep === "idle" ? "editing" : "idle"
              )
            }
          >
            {phoneUpdateStep === "idle" ? "Change" : "Cancel"}
          </Button>
        </div>
      </div>

      {phoneUpdateStep === "editing" && (
        <div className="p-3 border rounded-lg space-y-2">
          <label className="text-sm font-medium">Enter New Number</label>
          <Input
            placeholder="+256712345678"
            value={newPhoneNumber}
            onChange={(e) => setNewPhoneNumber(e.target.value)}
          />
          <Button
            onClick={handleInitiatePhoneUpdate}
            disabled={isSendingOtp}
            className="w-full"
          >
            {isSendingOtp ? "Sending..." : "Send Verification Code"}
          </Button>
        </div>
      )}

      {phoneUpdateStep === "verifying" && (
        <div className="p-3 border rounded-lg space-y-2 bg-primary/5">
          <label className="text-sm font-medium">Enter 6-Digit Code</label>
          <p className="text-xs text-gray-500">Sent to {newPhoneNumber}</p>
          <Input
            placeholder="123456"
            value={phoneOtp}
            onChange={(e) => setPhoneOtp(e.target.value)}
          />
          <Button
            onClick={handleVerifyPhoneUpdate}
            disabled={isVerifyingOtp}
            className="w-full"
          >
            {isVerifyingOtp ? "Verifying..." : "Verify and Update Number"}
          </Button>
        </div>
      )}
    </>
  );
};
