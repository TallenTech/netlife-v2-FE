#!/usr/bin/env -S deno run --allow-all

/**
 * Simple validation script to test phone utilities
 * Run with: deno run --allow-all validate-phone-utils.ts
 */

import {
  validatePhoneNumber,
  normalizePhoneNumber,
  formatPhoneNumber,
  arePhoneNumbersEqual
} from "./utils/phone.ts";

console.log("🧪 Testing Phone Number Utilities\n");

// Test cases
const testCases = [
  // Valid cases
  { phone: "+12345678900", shouldBeValid: true, description: "US number" },
  { phone: "+1 (234) 567-8900", shouldBeValid: true, description: "US number with formatting" },
  { phone: "+442079460958", shouldBeValid: true, description: "UK number" },
  { phone: "+44 20 7946 0958", shouldBeValid: true, description: "UK number with spaces" },
  { phone: "+33142868326", shouldBeValid: true, description: "French number" },
  
  // Invalid cases
  { phone: "1234567890", shouldBeValid: false, description: "Missing + prefix" },
  { phone: "+1234", shouldBeValid: false, description: "Too short" },
  { phone: "+0123456789", shouldBeValid: false, description: "Starts with 0" },
  { phone: "invalid", shouldBeValid: false, description: "Not a number" },
  { phone: "", shouldBeValid: false, description: "Empty string" }
];

let passed = 0;
let failed = 0;

console.log("📞 Testing validatePhoneNumber:");
testCases.forEach((testCase, index) => {
  const result = validatePhoneNumber(testCase.phone);
  const success = result.isValid === testCase.shouldBeValid;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${testCase.description} - PASSED`);
    if (result.isValid) {
      console.log(`   Normalized: ${result.normalized}`);
    }
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description} - FAILED`);
    console.log(`   Expected: ${testCase.shouldBeValid}, Got: ${result.isValid}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    failed++;
  }
});

console.log("\n📱 Testing normalizePhoneNumber:");
const normalizeTests = [
  { input: "+1 (234) 567-8900", expected: "+12345678900" },
  { input: "001234567890", expected: "+1234567890" },
  { input: "+44-20-7946-0958", expected: "+442079460958" }
];

normalizeTests.forEach((test, index) => {
  const result = normalizePhoneNumber(test.input);
  if (result === test.expected) {
    console.log(`✅ Normalize ${index + 1}: "${test.input}" → "${result}" - PASSED`);
    passed++;
  } else {
    console.log(`❌ Normalize ${index + 1}: "${test.input}" → "${result}" - FAILED`);
    console.log(`   Expected: "${test.expected}"`);
    failed++;
  }
});

console.log("\n💅 Testing formatPhoneNumber:");
const formatTests = [
  { input: "+12345678900", expected: "+1 (234) 567-8900" },
  { input: "+442079460958", expected: "+44 20 7946 0958" }
];

formatTests.forEach((test, index) => {
  const result = formatPhoneNumber(test.input);
  if (result === test.expected) {
    console.log(`✅ Format ${index + 1}: "${test.input}" → "${result}" - PASSED`);
    passed++;
  } else {
    console.log(`❌ Format ${index + 1}: "${test.input}" → "${result}" - FAILED`);
    console.log(`   Expected: "${test.expected}"`);
    failed++;
  }
});

console.log("\n🔄 Testing arePhoneNumbersEqual:");
const equalityTests = [
  { phone1: "+12345678900", phone2: "+1 (234) 567-8900", expected: true },
  { phone1: "+12345678900", phone2: "+12345678901", expected: false }
];

equalityTests.forEach((test, index) => {
  const result = arePhoneNumbersEqual(test.phone1, test.phone2);
  if (result === test.expected) {
    console.log(`✅ Equality ${index + 1}: "${test.phone1}" == "${test.phone2}" → ${result} - PASSED`);
    passed++;
  } else {
    console.log(`❌ Equality ${index + 1}: "${test.phone1}" == "${test.phone2}" → ${result} - FAILED`);
    console.log(`   Expected: ${test.expected}`);
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("🎉 All tests passed! Phone utilities are working correctly.");
} else {
  console.log("⚠️  Some tests failed. Please review the implementation.");
  Deno.exit(1);
}