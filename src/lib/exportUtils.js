import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import { LOGO_URL } from "./constants.js";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const calculateAge = (dob) => {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export async function createComprehensiveProfilePdf(
  mainProfile,
  managedProfiles
) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage;
  try {
    const logoBytes = await fetch(LOGO_URL).then((res) => res.arrayBuffer());
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.error("Failed to load logo, skipping:", error);
  }

  const purple = rgb(0.56, 0.23, 1);
  const lightPurple = rgb(0.91, 0.87, 1.0);
  const darkText = rgb(0.1, 0.1, 0.1);
  const lightText = rgb(0.4, 0.4, 0.4);
  const pageMargin = 50;
  let y = height - 160;

  const addNewPage = () => {
    page = pdfDoc.addPage(PageSizes.A4);
    y = height - pageMargin - 20;
    return page;
  };

  const checkPageBreak = (contentHeight) => {
    if (y - contentHeight < pageMargin) {
      addNewPage();
    }
  };

  const drawSectionHeader = (title) => {
    checkPageBreak(35);
    page.drawRectangle({
      x: pageMargin,
      y: y - 2,
      width: width - pageMargin * 2,
      height: 22,
      color: lightPurple,
    });
    page.drawText(title, {
      x: pageMargin + 10,
      y: y + 5,
      font: boldFont,
      size: 12,
      color: darkText,
    });
    y -= 35;
  };

  const drawField = (label, value) => {
    if (value === null || value === undefined || String(value).trim() === "")
      return;
    checkPageBreak(22);
    page.drawText(`${label}:`, {
      x: pageMargin + 10,
      y,
      font,
      size: 11,
      color: lightText,
    });
    page.drawText(String(value), {
      x: pageMargin + 180,
      y,
      font: boldFont,
      size: 11,
      color: darkText,
    });
    y -= 22;
  };

  page.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 100,
    color: purple,
  });
  if (logoImage) {
    const logoDims = logoImage.scaleToFit(120, 40);
    page.drawImage(logoImage, {
      x: pageMargin,
      y: height - 80,
      width: logoDims.width,
      height: logoDims.height,
    });
  }
  page.drawText("Profile & Account Summary", {
    x: pageMargin,
    y: height - 125,
    font: boldFont,
    size: 22,
    color: purple,
  });

  drawSectionHeader("Main Account Holder");
  drawField("Name", mainProfile.username);
  drawField("Date of Birth", formatDate(mainProfile.date_of_birth));
  drawField("Age", `${calculateAge(mainProfile.date_of_birth)} years`);
  drawField("Gender", mainProfile.gender);
  drawField("District", mainProfile.district);
  drawField("Sub-county", mainProfile.sub_county);
  y -= 15;

  if (managedProfiles && managedProfiles.length > 0) {
    drawSectionHeader("Managed Profiles");

    for (const profile of managedProfiles) {
      checkPageBreak(80);
      page.drawText(profile.username, {
        x: pageMargin,
        y,
        font: boldFont,
        size: 14,
        color: darkText,
      });
      y -= 25;
      drawField("Date of Birth", formatDate(profile.date_of_birth));
      drawField("Age", `${calculateAge(profile.date_of_birth)} years`);
      drawField("Gender", profile.gender);
      y -= 10;
      page.drawLine({
        start: { x: pageMargin, y: y },
        end: { x: width - pageMargin, y: y },
        thickness: 0.5,
        color: lightPurple,
      });
      y -= 20;
    }
  }

  return await pdfDoc.save();
}

export async function createEligibilityReportPdf(result, profile) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage;
  try {
    const logoBytes = await fetch(LOGO_URL).then((res) => res.arrayBuffer());
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.error("Failed to load logo, skipping:", error);
  }

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

  if (logoImage) {
    const logoDims = logoImage.scaleToFit(120, 40);
    page.drawImage(logoImage, {
      x: 40,
      y: height - 80,
      width: logoDims.width,
      height: logoDims.height,
    });
  }

  page.drawText("Eligibility Report", {
    x: 40,
    y: height - 125,
    font: boldFont,
    size: 22,
    color: purple,
  });

  let y = height - 160;
  const drawSectionHeader = (title) => {
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
  const drawField = (label, value) => {
    if (value === null || value === undefined || String(value).trim() === "")
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

  const fullDateFormatter = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  drawSectionHeader("Assessment Details");
  drawField("Service", result.services?.name);
  drawField("Assessed For", profile?.username);
  drawField("Date Completed", fullDateFormatter(result.completed_at));
  y -= 15;

  drawSectionHeader("Assessment Result");
  drawField(
    "Eligibility Status",
    result.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"
  );
  drawField("Risk Score", `${result.score}%`);
  y -= 15;

  if (
    result.answers_summary &&
    Object.keys(result.answers_summary).length > 0
  ) {
    drawSectionHeader("Answers Summary");
    for (const [question, answer] of Object.entries(result.answers_summary)) {
      page.drawText(question, {
        x: 50,
        y,
        font,
        size: 11,
        color: lightText,
        maxWidth: width - 100,
      });
      y -= 16;
      page.drawText(String(answer), {
        x: 65,
        y,
        font: boldFont,
        size: 11,
        color: darkText,
      });
      y -= 22;
      if (y < 100) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = height - 60;
      }
    }
  }

  page.drawRectangle({ x: 0, y: 0, width, height: 60, color: purple });
  return await pdfDoc.save();
}
