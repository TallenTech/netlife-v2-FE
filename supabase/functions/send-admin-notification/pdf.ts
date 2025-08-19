import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import { LOGO_URL } from "./constants.ts";

export async function createRequestPdf(details: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await fetch(LOGO_URL).then((res) => res.arrayBuffer());
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scaleToFit(120, 40);
  const purple = rgb(0.56, 0.23, 1);
  const lightPurple = rgb(0.91, 0.87, 1.0);
  const darkText = rgb(0.1, 0.1, 0.1);
  const lightText = rgb(0.4, 0.4, 0.4);

  page.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 100,
    color: purple,
  });
  page.drawImage(logoImage, {
    x: 40,
    y: height - 80,
    width: logoDims.width,
    height: logoDims.height,
  });
  page.drawText(String(details.service_name ?? "Service Request"), {
    x: 40,
    y: height - 125,
    font: boldFont,
    size: 22,
    color: purple,
  });

  let y = height - 160;
  const drawSectionHeader = (title: string) => {
    page.drawRectangle({
      x: 40,
      y: y - 2,
      width: width - 80,
      height: 22,
      color: lightPurple,
    });
    page.drawText(title, {
      x: 50,
      y: y + 5,
      font: boldFont,
      size: 12,
      color: darkText,
    });
    y -= 35;
  };
  const drawField = (label: string, value: any) => {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === "" ||
      String(value).trim().toLowerCase() === "n/a"
    )
      return;
    page.drawText(`${label}:`, { x: 50, y, font, size: 11, color: lightText });
    page.drawText(String(value), {
      x: 220,
      y,
      font: boldFont,
      size: 11,
      color: darkText,
    });
    y -= 22;
  };

  drawSectionHeader("Patient Details");
  drawField("Patient name", details.patient_name);
  drawField("Gender", details.patient_gender);
  drawField("Age", `${details.patient_age} years`);
  y -= 15;

  drawSectionHeader("Requester Contact & Location");
  drawField("Requester name", details.requester_name);
  drawField("Phone", details.requester_phone);
  drawField("WhatsApp", details.requester_whatsapp);
  drawField("District", details.requester_district);
  drawField("Sub-county", details.requester_sub_county);
  y -= 15;

  drawSectionHeader(`${details.service_name || "Service"} Request Details`);
  // drawField("Request ID", details.service_request_id);
  drawField("Date Submitted", details.service_created_at);
  drawField("Status", details.status);
  drawField("Quantity", details.quantity);
  drawField("Delivery Method", details.delivery_method);
  drawField("Delivery Location", details.delivery_location);
  drawField("Delivery Date", details.delivery_date);
  drawField("Delivery Time", details.delivery_time);
  drawField("Counselling Support", details.counselling_support);
  drawField("Counselling Channel", details.counselling_channel);
  drawField("Additional comments", details.additional_comments);

  page.drawRectangle({ x: 0, y: 0, width, height: 60, color: purple });
  return await pdfDoc.save();
}
