const serviceUIMapping = {
  // HIV Testing variations
  "HIV Testing": { category: "routine", color: "red", icon: "Heart" },
  "HIV testing": { category: "routine", color: "red", icon: "Heart" },
  "hiv testing": { category: "routine", color: "red", icon: "Heart" },
  "HIV Testing Services (HTS)": { category: "routine", color: "red", icon: "Heart" },
  "HTS": { category: "routine", color: "red", icon: "Heart" },

  // STI Screening variations
  "STI Screening": { category: "routine", color: "blue", icon: "Shield" },
  "STI screening": { category: "routine", color: "blue", icon: "Shield" },
  "sti screening": { category: "routine", color: "blue", icon: "Shield" },
  "STI": { category: "routine", color: "blue", icon: "Shield" },

  // PrEP Access variations
  "PrEP Access": { category: "follow-up", color: "green", icon: "Calendar" },
  "PrEP access": { category: "follow-up", color: "green", icon: "Calendar" },
  "prep access": { category: "follow-up", color: "green", icon: "Calendar" },
  "Pre-exposure Prophylaxis (PrEP)": { category: "follow-up", color: "green", icon: "Calendar" },
  "PrEP": { category: "follow-up", color: "green", icon: "Calendar" },

  // PEP Access variations
  "PEP Access": { category: "urgent", color: "yellow", icon: "Star" },
  "PEP access": { category: "urgent", color: "yellow", icon: "Star" },
  "pep access": { category: "urgent", color: "yellow", icon: "Star" },
  "Post-exposure Prophylaxis (PEP)": { category: "urgent", color: "yellow", icon: "Star" },
  "PEP": { category: "urgent", color: "yellow", icon: "Star" },

  // ART Support variations
  "ART Support": { category: "follow-up", color: "purple", icon: "HeartPulse" },
  "ART support": { category: "follow-up", color: "purple", icon: "HeartPulse" },
  "art support": { category: "follow-up", color: "purple", icon: "HeartPulse" },
  "Antiretroviral Therapy (ART)": { category: "follow-up", color: "purple", icon: "HeartPulse" },
  "ART": { category: "follow-up", color: "purple", icon: "HeartPulse" },

  // Counseling variations
  "Counseling": { category: "routine", color: "indigo", icon: "UserCheck" },
  "counseling": { category: "routine", color: "indigo", icon: "UserCheck" },
  "Counselling": { category: "routine", color: "indigo", icon: "UserCheck" },
  "counselling": { category: "routine", color: "indigo", icon: "UserCheck" },
  "Counselling Services": { category: "routine", color: "indigo", icon: "UserCheck" },
  "counselling services": { category: "routine", color: "indigo", icon: "UserCheck" },
};

export const transformServiceData = (service) => {
  // First try exact match
  let uiMapping = serviceUIMapping[service.name];

  // If no exact match, try case-insensitive match
  if (!uiMapping) {
    const serviceNameLower = service.name.toLowerCase();
    for (const [key, value] of Object.entries(serviceUIMapping)) {
      if (key.toLowerCase() === serviceNameLower) {
        uiMapping = value;
        break;
      }
    }
  }

  // If still no match, try partial matching
  if (!uiMapping) {
    const serviceNameLower = service.name.toLowerCase();
    if (serviceNameLower.includes('hiv') || serviceNameLower.includes('hts')) {
      uiMapping = { category: "routine", color: "red", icon: "Heart" };
    } else if (serviceNameLower.includes('sti') || serviceNameLower.includes('screening')) {
      uiMapping = { category: "routine", color: "blue", icon: "Shield" };
    } else if (serviceNameLower.includes('prep')) {
      uiMapping = { category: "follow-up", color: "green", icon: "Calendar" };
    } else if (serviceNameLower.includes('pep')) {
      uiMapping = { category: "urgent", color: "yellow", icon: "Star" };
    } else if (serviceNameLower.includes('art')) {
      uiMapping = { category: "follow-up", color: "purple", icon: "HeartPulse" };
    } else if (serviceNameLower.includes('counsel') || serviceNameLower.includes('guidance')) {
      uiMapping = { category: "routine", color: "indigo", icon: "UserCheck" };
    }
  }

  // Final fallback
  if (!uiMapping) {
    uiMapping = {
      category: "routine",
      color: "blue",
      icon: "Heart",
    };
  }

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
