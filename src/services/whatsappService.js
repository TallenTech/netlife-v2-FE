import { supabase } from "@/lib/supabase";
import { cleanPhoneNumber } from "@/lib/phoneUtils";

export const whatsappAuth = {
  sendCode: async (phoneNumber) => {
    const cleanedNumber = cleanPhoneNumber(phoneNumber);
    const { data, error } = await supabase.functions.invoke(
      "start-whatsapp-verify",
      {
        body: { phone: cleanedNumber },
      }
    );

    if (error) {
      console.error("Error sending code:", error);
      throw error;
    }
    return data;
  },

  verifyCode: async (phoneNumber, code) => {
    const cleanedNumber = cleanPhoneNumber(phoneNumber);
    const { data, error } = await supabase.functions.invoke(
      "check-whatsapp-verify",
      {
        body: { phone: cleanedNumber, code },
      }
    );

    if (error) {
      console.error("Error verifying code:", error);
      throw error;
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: data.properties.access_token,
        refresh_token: data.properties.refresh_token,
      });

    if (sessionError) {
      console.error("Error setting session:", sessionError);
      throw sessionError;
    }

    return { success: true, user: data.user, session: sessionData.session };
  },
};
