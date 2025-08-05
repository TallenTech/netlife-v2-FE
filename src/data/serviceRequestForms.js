export const serviceRequestForms = {
  'hts': {
    title: 'HIV Self-Test Request',
    steps: [
      {
        title: 'Choose Your Test',
        fields: [
          { name: 'testOption', label: 'Preferred Test Option', type: 'radio', options: ['Oral fluid self-test kit', 'Finger-prick self-test kit', 'Facility-based HIV testing appointment'] },
          { name: 'quantity', label: 'Number of kits needed', type: 'number', placeholder: 'e.g., 1' },
        ],
      },
      {
        title: 'Delivery & Support',
        fields: [
          { name: 'deliveryMethod', label: 'Delivery Method', type: 'radio', options: ['Home Delivery', 'Pick-up from facility', 'Community Group Delivery'], condition: (data) => data.testOption !== 'Facility-based HIV testing appointment' },
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home Delivery', 'Community Group Delivery'].includes(data.deliveryMethod) },
          { name: 'deliveryDate', label: 'Preferred Delivery/Appointment Date', type: 'datetime-local' },
        ],
      },
      {
        title: 'Counselling & Comments',
        fields: [
          { name: 'counsellingSupport', label: 'Do you require counselling support?', type: 'radio', options: ['Yes', 'No'] },
          { name: 'counsellingChannel', label: 'Preferred channel for counselling?', type: 'select', options: ['Phone Call', 'WhatsApp', 'Video (Zoom/Google Meet)', 'In-Person'], condition: (data) => data.counsellingSupport === 'Yes' },
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
          { name: 'serviceRequested', label: 'Service Requested', type: 'radio', options: ['Start PrEP (first-time user)', 'Refill PrEP medication', 'Follow-up Visit'] },
          { name: 'quantity', label: 'Quantity (e.g., bottles)', type: 'number', placeholder: 'e.g., 1' },
          { name: 'hivTestResult', label: 'Attach Latest HIV Test Result', type: 'file', accept: '.pdf,.jpg,.png' },
        ],
      },
      {
        title: 'Delivery & Follow-up',
        fields: [
          { name: 'deliveryMethod', label: 'Preferred Delivery Method', type: 'radio', options: ['Home Delivery', 'Pickup at health facility', 'Community Group Delivery'] },
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home Delivery', 'Community Group Delivery'].includes(data.deliveryMethod) },
          { name: 'deliveryDate', label: 'Preferred Delivery/Appointment Date', type: 'datetime-local' },
          { name: 'contactChannel', label: 'Preferred Contact Channel for Follow-Up', type: 'select', options: ['Phone call', 'WhatsApp', 'Not Needed'] },
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
  'pep': {
    title: 'PEP Service Request',
    steps: [
      {
        title: 'Request Details',
        fields: [
          { name: 'requestType', label: 'Request Type', type: 'radio', options: ['Start PEP (exposure within 72 hours)', 'Continue/refill PEP', 'Follow-up test or medical review'] },
          { name: 'accessPoint', label: 'Preferred Access Point for Medication', type: 'radio', options: ['Home Delivery', 'Facility pickup', 'Community Group Delivery'] },
          { name: 'quantity', label: 'Quantity (e.g., packs)', type: 'number', placeholder: 'e.g., 1' },
          { name: 'hivTestResult', label: 'Attach Latest HIV Test Result', type: 'file', accept: '.pdf,.jpg,.png' },
        ],
      },
      {
        title: 'Location & Counselling',
        fields: [
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home Delivery', 'Community Group Delivery'].includes(data.accessPoint) },
          { name: 'deliveryDate', label: 'Preferred Delivery/Appointment Date', type: 'datetime-local' },
          { name: 'counsellingSupport', label: 'Do you need counselling or psychosocial support?', type: 'radio', options: ['Yes', 'No'] },
          { name: 'counsellingChannel', label: 'Preferred channel for counselling?', type: 'select', options: ['Phone Call', 'WhatsApp Call', 'Video (Zoom/Google Meet)', 'In-Person'], condition: (data) => data.counsellingSupport === 'Yes' },
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
          { name: 'requestType', label: 'Request Type', type: 'radio', options: ['Start ART for the first time', 'Resume ART after default', 'Refill or switch regimen'] },
          { name: 'quantity', label: 'Quantity (e.g., bottles)', type: 'number', placeholder: 'e.g., 1' },
          { name: 'prescription', label: 'Attach Referral Slip or Prescription', type: 'file', accept: '.pdf,.jpg,.png' },
        ],
      },
      {
        title: 'Delivery & Clinical Needs',
        fields: [
          { name: 'deliveryMethod', label: 'Preferred Pickup or Delivery', type: 'radio', options: ['Home Delivery', 'Facility pickup', 'Community Group Delivery'] },
          { name: 'deliveryLocation', label: 'Preferred Delivery Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home Delivery', 'Community Group Delivery'].includes(data.deliveryMethod) },
          { name: 'deliveryDate', label: 'Preferred Delivery/Appointment Date', type: 'datetime-local' },
          { name: 'clinicalReview', label: 'Do you need clinical review or lab tests scheduled?', type: 'radio', options: ['Yes (e.g., viral load, CD4)', 'No'] },
        ],
      },
      {
        title: 'Support & Comments',
        fields: [
          { name: 'counsellingSupport', label: 'Do you need counselling or psychosocial support?', type: 'radio', options: ['Yes', 'No'] },
          { name: 'counsellingChannel', label: 'Preferred channel for counselling?', type: 'select', options: ['Phone Call', 'WhatsApp Call', 'Video (Zoom/Google Meet)', 'In-Person'], condition: (data) => data.counsellingSupport === 'Yes' },
          { name: 'comments', label: 'General Comment', type: 'textarea', placeholder: 'Share any other details or questions you have for the health provider.' },
        ],
      },
    ],
  },
  'sti': {
    title: 'STI Screening & Treatment',
    steps: [
      {
        title: 'Service Details',
        fields: [
          { name: 'serviceRequested', label: 'Service Requested', type: 'radio', options: ['Book in-person STI screening', 'Request home sample collection', 'Request online consultation', 'Request medication refill'] },
          { name: 'labResults', label: 'Attach Previous Lab Results or Treatment Notes (optional)', type: 'file', accept: '.pdf,.jpg,.png' },
        ],
      },
      {
        title: 'Location & Delivery',
        fields: [
          { name: 'deliveryMethod', label: 'Preferred Method of Delivery/Service', type: 'radio', options: ['Home Delivery', 'Facility pickup', 'Community Group Delivery'] },
          { name: 'deliveryLocation', label: 'Preferred Location', type: 'map', placeholder: 'Search for a location...', condition: (data) => ['Home Delivery', 'Community Group Delivery'].includes(data.deliveryMethod) },
          { name: 'preferredDate', label: 'Preferred Appointment Date', type: 'datetime-local' },
        ],
      },
      {
        title: 'Support & Consultation',
        fields: [
          { name: 'partnerSupport', label: 'Do you require partner notification or treatment support?', type: 'radio', options: ['Yes', 'No'] },
          { name: 'consultationMode', label: 'Preferred Consultation Mode (if needed)', type: 'select', options: ['Phone call', 'WhatsApp chat', 'In-person', 'Video (Zoom/Google Meet)'] },
          { name: 'comments', label: 'General Comment', type: 'textarea', placeholder: 'Share any other details or questions you have for the health provider.' },
        ],
      },
    ],
  },
  'counselling': {
    title: 'Counselling Booking Form',
    steps: [
      {
        title: 'Counselling Needs',
        fields: [
          { name: 'counsellingType', label: 'Type of Counselling Needed', type: 'radio', options: ['Post-HIV diagnosis support', 'HIV Pre-test / test-result', 'Post-test / status disclosure', 'Adherence counselling', 'Safer Sex Education', 'GBV-related trauma support', 'General psychosocial'] },
        ],
      },
      {
        title: 'Scheduling',
        fields: [
          { name: 'modality', label: 'Preferred Counselling Modality', type: 'radio', options: ['Phone call', 'WhatsApp chat', 'Video (Zoom/Google Meet)', 'In-person'] },
          { name: 'preferredDate', label: 'Preferred Appointment Date', type: 'datetime-local' },
          { name: 'preferredTime', label: 'Preferred Time', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Weekend only'] },
        ],
      },
    ],
  },
};