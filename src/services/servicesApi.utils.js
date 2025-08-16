const serviceUIMapping = {
  "HIV Testing": { category: "routine", color: "red", icon: "Heart" },
  "STI Screening": { category: "routine", color: "blue", icon: "Shield" },
  "PrEP Access": { category: "follow-up", color: "green", icon: "Calendar" },
  "PEP Access": { category: "urgent", color: "yellow", icon: "Star" },
  "ART Support": { category: "follow-up", color: "purple", icon: "HeartPulse" },
  Counseling: { category: "routine", color: "indigo", icon: "UserCheck" },
  Counselling: { category: "routine", color: "indigo", icon: "UserCheck" },
};

export const transformServiceData = (service) => {
  const uiMapping = serviceUIMapping[service.name] || {
    category: "routine",
    color: "blue",
    icon: "Heart",
  };

  return {
    id: service.id,
    slug: service.slug,
    title: service.name,
    desc: service.description,
    category: uiMapping.category,
    color: uiMapping.color,
    icon: uiMapping.icon,
  };
};

export const transformQuestionData = (question, options = []) => {
  return {
    id: question.id,
    service_id: question.service_id,
    question_text: question.question_text,
    question_type: question.question_type,
    required: question.required,
    options: options.map((option) => ({
      id: option.id,
      text: option.option_text,
      value: option.value,
    })),
  };
};

export const calculateEligibility = (answers) => {
  const answerValues = Object.values(answers);

  if (answerValues.length === 0) {
    return {
      eligible: false,
      score: 0,
    };
  }

  const yesCount = answerValues.filter((answer) => {
    const normalizedAnswer = String(answer).toLowerCase();
    return normalizedAnswer === "yes" || normalizedAnswer === "true";
  }).length;

  const score = Math.round((yesCount / answerValues.length) * 100);
  const eligible = yesCount > 0;

  return {
    eligible,
    score,
  };
};

export const extractCommonFields = (requestData) => {
  const extracted = {
    delivery_method: null,
    delivery_location: null,
    preferred_date: null,
    quantity: null,
    counselling_required: null,
    counselling_channel: null,
  };

  if (!requestData || typeof requestData !== "object") {
    return extracted;
  }

  if (requestData.deliveryMethod) {
    extracted.delivery_method = requestData.deliveryMethod;
  } else if (requestData.accessPoint) {
    extracted.delivery_method = requestData.accessPoint;
  }

  if (requestData.deliveryLocation) {
    if (typeof requestData.deliveryLocation === "string") {
      extracted.delivery_location = {
        address: requestData.deliveryLocation,
        coordinates: null,
        details: null,
      };
    } else if (typeof requestData.deliveryLocation === "object") {
      extracted.delivery_location = {
        address: requestData.deliveryLocation.address || null,
        coordinates: requestData.deliveryLocation.coordinates || null,
        details: requestData.deliveryLocation.details || null,
        timestamp: requestData.deliveryLocation.timestamp || null,
      };
    }
  }

  let dateValue =
    requestData.preferredDateTime ||
    requestData.deliveryDate ||
    requestData.preferredDate;
  if (dateValue) {
    const selectedDate = new Date(dateValue);
    const now = new Date();
    const minDate = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    if (selectedDate >= minDate && selectedDate <= maxDate) {
      extracted.preferred_date = dateValue;
    } else {
      extracted.preferred_date = null;
    }
  }

  if (
    requestData.quantity !== undefined &&
    requestData.quantity !== null &&
    requestData.quantity !== ""
  ) {
    const qty =
      typeof requestData.quantity === "number"
        ? requestData.quantity
        : parseInt(requestData.quantity);
    if (!isNaN(qty)) {
      extracted.quantity = qty;
    }
  }

  if (requestData.counsellingSupport) {
    extracted.counselling_required =
      requestData.counsellingSupport === "Yes" ||
      requestData.counsellingSupport === true;

    if (extracted.counselling_required && requestData.counsellingChannel) {
      extracted.counselling_channel = requestData.counsellingChannel;
    }
  }

  return extracted;
};

export const ATTACHMENT_ERROR_MESSAGES = {
  NO_FILE: "No file provided",
  INVALID_FILE_TYPE:
    "Please upload PDF, JPEG, or PNG files only. Other file types are not supported.",
  FILE_TOO_LARGE:
    "File size must be under 5MB. Please compress your file or choose a smaller one.",
  FILE_CORRUPTED:
    "File appears to be corrupted or unreadable. Please try uploading a different file.",
  INVALID_URL: "Invalid attachment URL. Please ensure the link is accessible.",
  URL_NOT_ACCESSIBLE:
    "Attachment URL is not accessible. Please check the link or upload a new file.",
  PROCESSING_FAILED:
    "Failed to process attachment. Please try again or contact support if the issue persists.",
};

export const validateDeliveryPreferences = (requestData) => {
  const errors = [];
  if (requestData.deliveryMethod || requestData.accessPoint) {
    const method = requestData.deliveryMethod || requestData.accessPoint;
    const validMethods = [
      "Home Delivery",
      "Facility pickup",
      "Community Group Delivery",
      "Pick-up from facility",
    ];
    if (!validMethods.includes(method)) {
      errors.push(`Invalid delivery method: ${method}`);
    }
    const locationBasedMethods = ["Home Delivery", "Community Group Delivery"];
    if (
      locationBasedMethods.includes(method) &&
      !requestData.deliveryLocation
    ) {
      errors.push(
        "Delivery location is required for the selected delivery method"
      );
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};
