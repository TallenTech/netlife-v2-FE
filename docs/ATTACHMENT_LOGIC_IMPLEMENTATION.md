# Attachment Logic Implementation

## Overview
Updated the service request forms to implement the correct attachment logic based on service requirements.

## Changes Made

### 1. PrEP Service Request (`prep`)
- **Before**: `hivTestResult` field was not required
- **After**: `labResults` field is now **required** for all PrEP requests
- **Field Name**: Changed from `hivTestResult` to `labResults`
- **Label**: "Attach Latest Lab Results"

### 2. PEP Service Request (`pep`)
- **Before**: `hivTestResult` field was conditionally required based on request type
- **After**: `labResults` field is now **required** for all PEP requests
- **Field Name**: Changed from `hivTestResult` to `labResults`
- **Label**: "Attach Latest Lab Results"

### 3. ART Service Request (`art`)
- **Before**: `prescription` field was conditionally required based on request type
- **After**: `labResults` field is now **required** for all ART requests
- **Field Name**: Changed from `prescription` to `labResults`
- **Label**: "Attach Latest Lab Results"

### 4. STI Screening (`sti-screening`)
- **Before**: `labResults` field was conditionally required based on service type
- **After**: `labResults` field is now **optional** for all STI screening requests
- **Field Name**: Kept as `labResults`
- **Label**: "Attach Previous Lab Results or Treatment Notes (Optional)"
- **Required**: Set to `false`

### 5. HIV Testing & Counselling (`hts`)
- **Status**: No changes needed - no attachments required ✅

### 6. Counselling Services (`counselling-services`)
- **Status**: No changes needed - no attachments required ✅

## Files Modified

1. **`src/data/serviceRequestForms.js`**
   - Updated field configurations for all service types
   - Standardized field names to `labResults`
   - Updated labels for consistency
   - Set proper required/optional flags

2. **`src/pages/RecordViewer.jsx`**
   - Added `labResults` to the list of file fields that should only appear in Attachments section

## Attachment Logic Summary

| Service | Attachment Required | Field Name | Notes |
|---------|-------------------|------------|-------|
| HIV Testing & Counselling | ❌ No | N/A | No attachments needed |
| PrEP | ✅ Yes | `labResults` | Latest lab results required |
| PEP | ✅ Yes | `labResults` | Latest lab results required |
| ART | ✅ Yes | `labResults` | Latest lab results required |
| STI Screening | ⚪ Optional | `labResults` | Previous results optional |
| Counselling Services | ❌ No | N/A | No attachments needed |

## Validation
- File upload validation is handled by the `ServiceRequestStep` component
- Required fields will show validation errors if not provided
- Optional fields (STI Screening) will not block form submission
- File type restrictions: `.pdf`, `.jpg`, `.png`

## Testing Checklist
- [ ] PrEP form requires lab results attachment
- [ ] PEP form requires lab results attachment  
- [ ] ART form requires lab results attachment
- [ ] STI Screening form allows optional lab results attachment
- [ ] HIV Testing & Counselling form has no attachment fields
- [ ] Counselling Services form has no attachment fields
- [ ] RecordViewer properly displays attachments in dedicated section
- [ ] Form validation works correctly for all attachment scenarios
