import { supabase } from "@/lib/supabase";
import { cleanPhoneNumber } from "@/lib/phoneUtils";

export const whatsappAuth = {
  sendCode: async (phoneNumber) => {
    const cleanedNumber = cleanPhoneNumber(phoneNumber);

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: cleanedNumber,
      options: {
        channel: "whatsapp",
      },
    });

    if (error) {
      console.error("Error sending OTP via Supabase Auth:", error);
      throw error;
    }
    return data;
  },

  verifyCode: async (phoneNumber, code) => {
    const cleanedNumber = cleanPhoneNumber(phoneNumber);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: cleanedNumber,
      token: code,
      type: "sms",
    });

    if (error) {
      console.error("Error verifying OTP via Supabase Auth:", error);
      // throw error;
    }

    return { success: true, user: data.user, session: data.session };
  },
};
