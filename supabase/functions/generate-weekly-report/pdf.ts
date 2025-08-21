import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface ReportData {
  totalUsers: number;
  newUsersCount: number;
  totalRequests: number;
  newRequestsCount: number;
  mostRequested: { name: string; count: number }[];
  leastRequested: { name: string; count: number }[];
  topActiveUsers: { username: string; count: number }[];
  newUsersList: {
    username: string;
    whatsapp_number: string;
    created_at: string;
  }[];
}

async function getChartImage(config: object): Promise<ArrayBuffer> {
  const response = await fetch("https://quickchart.io/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chart: config }),
  });
  if (!response.ok) throw new Error("Failed to fetch chart");
  return response.arrayBuffer();
}

export async function generatePdf(
  data: ReportData,
  signedLogoUrl: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const today = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dateRange = `${sevenDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;
  const logoImageBytes = await fetch(signedLogoUrl).then((res) =>
    res.arrayBuffer()
  );
  const logoImage = await pdfDoc.embedPng(logoImageBytes);
  const logoDims = logoImage.scale(0.25);
  page.drawImage(logoImage, {
    x: 50,
    y: height - logoDims.height - 50,
    width: logoDims.width,
    height: logoDims.height,
  });
  page.drawText("NetLife Weekly Performance Report", {
    x: 50,
    y: height - 150,
    font: boldFont,
    size: 24,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(dateRange, {
    x: 50,
    y: height - 175,
    font: font,
    size: 14,
    color: rgb(0.4, 0.4, 0.4),
  });
  let y = height - 220;
  page.drawText("Key Metrics", { x: 50, y, font: boldFont, size: 18 });
  y -= 30;
  page.drawText(`Total Users: ${data.totalUsers}`, {
    x: 70,
    y,
    font: font,
    size: 12,
  });
  y -= 20;
  page.drawText(`New Users This Week: ${data.newUsersCount}`, {
    x: 70,
    y,
    font: font,
    size: 12,
  });
  y -= 30;
  page.drawText(`Total Service Requests: ${data.totalRequests}`, {
    x: 70,
    y,
    font: font,
    size: 12,
  });
  y -= 20;
  page.drawText(`New Requests This Week: ${data.newRequestsCount}`, {
    x: 70,
    y,
    font: font,
    size: 12,
  });
  y -= 50;
  page.drawLine({
    start: { x: 50, y: y + 20 },
    end: { x: 550, y: y + 20 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  page.drawText("Most Requested Services (This Week)", {
    x: 50,
    y,
    font: boldFont,
    size: 18,
  });
  y -= 20;
  const chartConfig = {
    type: "bar",
    data: {
      labels: data.mostRequested?.map((s) => s.name) || [],
      datasets: [
        {
          label: "Requests",
          data: data.mostRequested?.map((s) => s.count) || [],
          backgroundColor: "rgba(99, 102, 241, 0.7)",
        },
      ],
    },
    options: {
      legend: { display: false },
      title: { display: true, text: "Top 5 Most Requested Services" },
    },
  };
  const chartImageBytes = await getChartImage(chartConfig);
  const chartImage = await pdfDoc.embedPng(chartImageBytes);
  page.drawImage(chartImage, { x: 70, y: y - 200, width: 450, height: 200 });
  const page2 = pdfDoc.addPage();
  y = height - 70;
  page2.drawText("Top 5 Most Active Users (by requests)", {
    x: 50,
    y,
    font: boldFont,
    size: 18,
  });
  y -= 30;
  page2.drawText("Username", { x: 70, y, font: boldFont, size: 12 });
  page2.drawText("Requests This Week", { x: 300, y, font: boldFont, size: 12 });
  y -= 15;
  for (const user of data.topActiveUsers || []) {
    page2.drawText(user.username, { x: 70, y, font: font, size: 11 });
    page2.drawText(String(user.count), { x: 300, y, font: font, size: 11 });
    y -= 15;
  }
  y -= 40;
  page2.drawLine({
    start: { x: 50, y: y + 20 },
    end: { x: 550, y: y + 20 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  page2.drawText("New Users This Week", { x: 50, y, font: boldFont, size: 18 });
  y -= 30;
  page2.drawText("Username", { x: 70, y, font: boldFont, size: 12 });
  page2.drawText("WhatsApp Number", { x: 250, y, font: boldFont, size: 12 });
  page2.drawText("Joined On", { x: 450, y, font: boldFont, size: 12 });
  y -= 15;
  for (const user of data.newUsersList || []) {
    page2.drawText(user.username, { x: 70, y, font: font, size: 10 });
    page2.drawText(user.whatsapp_number, { x: 250, y, font: font, size: 10 });
    page2.drawText(new Date(user.created_at).toLocaleDateString(), {
      x: 450,
      y,
      font: font,
      size: 10,
    });
    y -= 15;
    if (y < 50) {
      const newPage = pdfDoc.addPage();
      y = height - 70;
    }
  }
  return pdfDoc.save();
}
