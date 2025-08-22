const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function formatRequestAsText(request, profile) {
  let content = `========================================\n`;
  content += `     SERVICE REQUEST SUMMARY\n`;
  content += `========================================\n\n`;
  content += `Service:           ${request.services?.name || "N/A"}\n`;
  content += `Requested For:     ${profile?.username || "N/A"}\n`;
  content += `Request ID:        ${request.id}\n`;
  content += `Status:            ${request.status || "N/A"}\n`;
  content += `Date Requested:    ${formatDate(request.created_at)}\n\n`;

  content += `----------------------------------------\n`;
  content += `     ORDER DETAILS\n`;
  content += `----------------------------------------\n\n`;
  content += `Quantity:              ${request.quantity || "N/A"}\n`;
  content += `Delivery Method:       ${request.delivery_method || "N/A"}\n`;
  content += `Delivery Location:     ${
    request.delivery_location?.address || "N/A"
  }\n`;
  content += `Preferred Date:        ${formatDate(request.preferred_date)}\n\n`;

  content += `Counselling Required:  ${
    request.counselling_required ? "Yes" : "No"
  }\n`;
  if (request.counselling_required) {
    content += `Counselling Channel:   ${
      request.counselling_channel || "N/A"
    }\n`;
  }

  if (request.request_data?.comments) {
    content += `\nAdditional Comments:\n${request.request_data.comments}\n`;
  }

  content += `\n========================================\n`;
  return content;
}

export function formatReportAsText(result, profile) {
  let content = `========================================\n`;
  content += `      ELIGIBILITY REPORT\n`;
  content += `========================================\n\n`;
  content += `Service:           ${result.services?.name || "N/A"}\n`;
  content += `Assessed For:      ${profile?.username || "N/A"}\n`;
  content += `Date Completed:    ${formatDate(result.completed_at)}\n\n`;
  content += `----------------------------------------\n`;
  content += `     ASSESSMENT RESULT\n`;
  content += `----------------------------------------\n\n`;
  content += `Eligibility Status:  ${
    result.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"
  }\n`;
  content += `Risk Score:          ${result.score}%\n\n`;

  if (result.answers_summary) {
    content += `----------------------------------------\n`;
    content += `     ANSWERS SUMMARY\n`;
    content += `----------------------------------------\n\n`;
    for (const [question, answer] of Object.entries(result.answers_summary)) {
      content += `Q: ${question}\n`;
      content += `A: ${answer}\n\n`;
    }
  }

  content += `========================================\n`;
  return content;
}
