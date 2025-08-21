import { encodeBase64 } from "std/encoding/base64.ts";
import {
  ADMIN_LIST,
  FROM_ADDRESS,
  ZEPTOMAIL_API_URL_TEMPLATE,
} from "./constants.ts";

export async function sendReportEmail(pdfBytes: Uint8Array) {
  const today = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const startDate = sevenDaysAgo.toLocaleDateString();
  const endDate = today.toLocaleDateString();
  const fileName = `NetLife_Report_${endDate.replace(/\//g, "-")}.pdf`;

  // CORRECT: Using the exact secret names and variables from your example
  const zeptoToken = Deno.env.get("ZEPTOMAIL_TOKEN");
  const zeptoTemplateKey = Deno.env.get("ZEPTOMAIL_TEMPLATE_WEEKLY_REPORT");

  if (!zeptoToken) {
    throw new Error("ZEPTOMAIL_TOKEN environment variable not set.");
  }
  if (!zeptoTemplateKey) {
    throw new Error(
      "ZEPTOMAIL_TEMPLATE_WEEKLY_REPORT environment variable not set."
    );
  }

  // Loop through admins to send individual emails, matching your other function's pattern
  for (const admin of ADMIN_LIST) {
    const subject = `NetLife Weekly Report: ${startDate} to ${endDate}`;

    const mergeInfo = {
      // These match the template placeholders {{startDate}} and {{endDate}}
      startDate: startDate,
      endDate: endDate,
    };

    const emailApiPayload = {
      template_key: zeptoTemplateKey,
      from: {
        address: FROM_ADDRESS,
        name: "NetLife System",
      },
      to: [
        {
          email_address: {
            address: admin.email,
            name: admin.name,
          },
        },
      ],
      subject: subject,
      merge_info: mergeInfo,
      attachments: [
        {
          content: encodeBase64(pdfBytes),
          name: fileName,
          mime_type: "application/pdf",
        },
      ],
    };

    const response = await fetch(ZEPTOMAIL_API_URL_TEMPLATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: zeptoToken,
      },
      body: JSON.stringify(emailApiPayload),
    });

    if (!response.ok) {
      console.error(
        `Failed to send report email to ${admin.email}:`,
        await response.json()
      );
    } else {
      console.log(`Report email sent successfully to ${admin.email}.`);
    }
  }
}
