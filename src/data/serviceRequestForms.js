export const serviceRequestForms = {
  'hts': {
    title: 'HIV Self-Test Request',
    steps: [
      {
        title: 'Choose Your Test',
        fields: [
          { name: 'testOption', label: 'Preferred Test Option', type: 'radio', options: ['Oral fluid self-test kit', 'Finger-prick self-test kit', 'Facility-based HIV testing'], required: true },
          { name: 'quantity', label: 'Number of kits needed', type: 'number', placeholder: 'e.g., 1', required: true },
        ],
      },
      {
        title: 'Delivery & Support',
        fields: [
          { name: 'deliveryMethod', label: 'Delivery Method', type: 'radio', options: ['Home/Workplace', 'Pick-up from facility', 'Community Group'], condition: (data) => data.testOption !== 'Facility-based HIV testing', required: true },
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home/Workplace', 'Community Group'].includes(data.deliveryMethod), required: true },
          { name: 'preferredDateTime', label: 'Preferred Delivery/Appointment Date & Time', type: 'datetime-local', required: true },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'comments', label: 'General Comment', type: 'textarea', placeholder: 'Share any other details or questions you have for the health provider.' },
        ],
      },
    ],
  },
  'prep': {
    title: 'PrEP Service Request',
    steps: [
      {
        title: 'Service Details',
        fields: [
          { name: 'serviceRequested', label: 'Service Requested', type: 'radio', options: ['Start PrEP (first-time user)', 'Refill PrEP medication', 'Follow-up Visit'], required: true },
          { name: 'quantity', label: 'Quantity (e.g., bottles)', type: 'number', placeholder: 'e.g., 1', required: true },
          { name: 'labResults', label: 'Attach Latest Lab Results', type: 'file', accept: '.pdf,.jpg,.png', required: true },
        ],
      },
      {
        title: 'Delivery & Follow-up',
        fields: [
          { name: 'deliveryMethod', label: 'Preferred Delivery Method', type: 'radio', options: ['Home/Workplace', 'Pickup at health facility', 'Community Group'], required: true },
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home/Workplace', 'Community Group'].includes(data.deliveryMethod), required: true },
          { name: 'preferredDateTime', label: 'Preferred Delivery/Appointment Date & Time', type: 'datetime-local', required: true },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'contactChannel', label: 'Preferred Contact Channel for Follow-Up', type: 'select', options: ['Phone call', 'WhatsApp', 'Not Needed'], required: true },
          { name: 'comments', label: 'General Comment', type: 'textarea', placeholder: 'Share any other details or questions you have for the health provider.' },
        ],
      },
    ],
  },
  'pep': {
    title: 'PEP Service Request',
    steps: [
      {
        title: 'Request Details',
        fields: [
          { name: 'requestType', label: 'Request Type', type: 'radio', options: ['Start PEP (New User)', 'Continue/refill PEP'], required: true },
          { name: 'accessPoint', label: 'Preferred Access Point for Medication', type: 'radio', options: ['Home/Workplace', 'Facility pickup', 'Community Group'], required: true },
          { name: 'quantity', label: 'Quantity (e.g., packs)', type: 'number', placeholder: 'e.g., 1', required: true },
          { name: 'labResults', label: 'Attach Latest Lab Results', type: 'file', accept: '.pdf,.jpg,.png', required: true },
        ],
      },
      {
        title: 'Location & Scheduling',
        fields: [
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home/Workplace', 'Community Group'].includes(data.accessPoint), required: true },
          { name: 'preferredDateTime', label: 'Preferred Delivery/Appointment Date & Time', type: 'datetime-local', required: true },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'comments', label: 'General Comment', type: 'textarea', placeholder: 'Share any other details or questions you have for the health provider.' },
        ],
      },
    ],
  },
  'art': {
    title: 'ART Service Request',
    steps: [
      {
        title: 'Request Details',
        fields: [
          { name: 'requestType', label: 'Request Type', type: 'radio', options: ['Start ART for the first time', 'Resume ART after default', 'Refill or switch regimen'], required: true },
          { name: 'quantity', label: 'Quantity (e.g., bottles)', type: 'number', placeholder: 'e.g., 1', required: true },
          { name: 'labResults', label: 'Attach Latest Lab Results', type: 'file', accept: '.pdf,.jpg,.png', required: true },
        ],
      },
      {
        title: 'Delivery & Clinical Needs',
        fields: [
          { name: 'deliveryMethod', label: 'Preferred Pickup or Delivery', type: 'radio', options: ['Home/Workplace', 'Facility pickup', 'Community Group'], required: true },
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home/Workplace', 'Community Group'].includes(data.deliveryMethod), required: true },
          { name: 'preferredDateTime', label: 'Preferred Delivery/Appointment Date & Time', type: 'datetime-local', required: true },
          { name: 'clinicalReview', label: 'Do you need clinical review or lab tests scheduled?', type: 'radio', options: ['Yes (e.g., viral load, CD4)', 'No'], required: true },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'comments', label: 'General Comment', type: 'textarea', placeholder: 'Share any other details or questions you have for the health provider.' },
        ],
      },
    ],
  },
  'sti-screening': {
    title: 'STI Screening & Treatment',
    steps: [
      {
        title: 'Service Details',
        fields: [
          { name: 'serviceRequested', label: 'Service Requested', type: 'radio', options: ['Facility Based STI screening', 'Online/Virtual Consultation', 'Medication Refill'], required: true },
          { name: 'labResults', label: 'Attach Previous Lab Results or Treatment Notes (Optional)', type: 'file', accept: '.pdf,.jpg,.png', required: false },
        ],
      },
      {
        title: 'Location & Delivery',
        fields: [
          { name: 'deliveryMethod', label: 'Preferred Method of Delivery/Service', type: 'radio', options: ['Home/Workplace', 'Facility pickup', 'Community Group'], required: true },
          { name: 'deliveryLocation', label: 'Preferred Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home/Workplace', 'Community Group'].includes(data.deliveryMethod), required: true },
          { name: 'preferredDateTime', label: 'Preferred Appointment Date & Time', type: 'datetime-local', required: true },
        ],
      },
      {
        title: 'Support & Consultation',
        fields: [
          { name: 'partnerSupport', label: 'Do you require partner notification or treatment support?', type: 'radio', options: ['Yes', 'No'], required: true },
          { name: 'consultationMode', label: 'Preferred Consultation Mode (if needed)', type: 'select', options: ['Phone call', 'WhatsApp chat', 'In-person', 'Video (Zoom/Google Meet)'], required: true },
          { name: 'comments', label: 'General Comment', type: 'textarea', placeholder: 'Share any other details or questions you have for the health provider.' },
        ],
      },
    ],
  },
  'counselling-services': {
    title: 'Counselling Booking Form',
    steps: [
      {
        title: 'Counselling Needs',
        fields: [
          { name: 'counsellingType', label: 'Type of Counselling Needed', type: 'radio', options: ['Post-HIV diagnosis support', 'HIV Pre-test / test-result', 'Post-test / status disclosure', 'Adherence counselling', 'Safer Sex Education', 'GBV-related trauma support', 'General psychosocial'], required: true },
        ],
      },
      {
        title: 'Scheduling',
        fields: [
          { name: 'modality', label: 'Preferred Counselling Modality', type: 'radio', options: ['Phone call', 'WhatsApp chat', 'Video (Zoom/Google Meet)', 'In-person'], required: true },
          { name: 'preferredDateTime', label: 'Preferred Appointment Date & Time', type: 'datetime-local', required: true },
        ],
      },
    ],
  },
};