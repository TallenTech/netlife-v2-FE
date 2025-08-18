export const FROM_ADDRESS = "life@netlife.cc";

export const ADMIN_LIST = [
  { name: "Tallen", email: "tallen@tallen.tech" },
  { name: "Musa", email: "musa@tallenhub.com" },
  // { name: "Mooya", email: "mooya@tallenhub.com" },
  { name: "Danniel", email: "Td117235@gmail.com" },
];

export const ADMIN_WHATSAPP_LIST = [
  "+256754560414",
  "+256758361967",
  "+256780777600",
];

export const ZEPTOMAIL_API_URL_TEMPLATE =
  "https://api.zeptomail.com/v1.1/email/template";

export const LOGO_URL =
  "https://res.cloudinary.com/dr6rfoqxy/image/upload/v1754989923/white2_qkwqhw.png";

// const adminTemplateSid = Deno.env.get("TWILIO_TEMPLATE_ADMIN_ALERT_SID")!;
// const adminMessage = `${requesterName} has requested "${
//   service?.name || "a service"
// }" for ${patientName}. Check email for PDF.`;
// if (adminTemplateSid) {
//   await Promise.all(
//     ADMIN_WHATSAPP_LIST.map((p) =>
//       sendWhatsappTemplate(p, adminTemplateSid, { "1": adminMessage })
//     )
//   );
// }
