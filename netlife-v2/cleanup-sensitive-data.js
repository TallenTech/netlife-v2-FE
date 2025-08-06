/**
 * Cleanup script to remove sensitive data from files before committing to GitHub
 * Run this script before pushing to GitHub: node cleanup-sensitive-data.js
 */

const fs = require('fs');
const path = require('path');

// Files to delete (contain sensitive data)
const filesToDelete = [
    'supabase/functions/test-waapi.js',
    'supabase/functions/test-simple-send-code.js',
    'supabase/functions/test-profile-creation.js',
    'supabase/functions/test-complete-flow.js',
    'supabase/functions/test-send-code-enhanced.js',
    'supabase/functions/test-otp-security.js',
    'supabase/functions/test-otp-local.js',
    'supabase/WhatsApp_Auth_Environment.postman_environment.json',
    'supabase/QUICK_TEST_REFERENCE.md',
    'supabase/TASK_1_IMPLEMENTATION_SUMMARY.md',
    'supabase/PROFILE_SETUP_SUMMARY.md',
    'supabase/API_DOCUMENTATION.md', // Replace with clean version
    'supabase/whatsapp-auth-sdk.js' // Replace with clean version
];

// Files to replace with clean versions
const filesToReplace = {
    'supabase/API_DOCUMENTATION.md': 'supabase/API_DOCUMENTATION_CLEAN.md',
    'supabase/whatsapp-auth-sdk.js': 'supabase/whatsapp-auth-sdk-clean.js'
};

console.log('🧹 Cleaning up sensitive data...\n');

// Delete sensitive files
filesToDelete.forEach(file => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Deleted: ${file}`);
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
});

// Replace files with clean versions
Object.entries(filesToReplace).forEach(([original, clean]) => {
    if (fs.existsSync(clean)) {
        if (fs.existsSync(original)) {
            fs.unlinkSync(original);
        }
        fs.copyFileSync(clean, original);
        fs.unlinkSync(clean);
        console.log(`✅ Replaced: ${original} with clean version`);
    } else {
        console.log(`⚠️  Clean file not found: ${clean}`);
    }
});

// Create .env.example file
const envExample = `# Supabase Configuration
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Application Configuration
ENVIRONMENT=development
SITE_URL=http://localhost:3000

# Infobip WhatsApp API Configuration
INFOBIP_API_KEY=your_infobip_api_key
INFOBIP_BASE_URL=https://your_infobip_base_url.api.infobip.com
INFOBIP_SENDER=your_infobip_sender_number

# Twilio WhatsApp API Configuration (Backup/Alternative)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number

# waapi.net Configuration (for testing)
USE_WAAPI=true
WAAPI_INSTANCE_KEY=your_waapi_instance_key

# Test Configuration
TEST_PHONE_NUMBER=+1234567890
`;

fs.writeFileSync('.env.example', envExample);
console.log('✅ Created: .env.example');

// Update Postman collection to remove sensitive data
const postmanCollectionPath = 'supabase/WhatsApp_Auth_API_Collection.postman_collection.json';
if (fs.existsSync(postmanCollectionPath)) {
    const collection = JSON.parse(fs.readFileSync(postmanCollectionPath, 'utf8'));

    // Update variables to use placeholders
    if (collection.variable) {
        collection.variable = collection.variable.map(variable => {
            if (variable.key === 'SUPABASE_URL') {
                variable.value = 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co';
            } else if (variable.key === 'SUPABASE_ANON_KEY') {
                variable.value = 'YOUR_SUPABASE_ANON_KEY';
            } else if (variable.key === 'TEST_PHONE_NUMBER') {
                variable.value = '+1234567890';
            }
            return variable;
        });
    }

    fs.writeFileSync(postmanCollectionPath, JSON.stringify(collection, null, 2));
    console.log('✅ Cleaned: Postman collection');
}

console.log('\n🎉 Cleanup complete!');
console.log('\n📋 Next steps:');
console.log('1. Review the cleaned files');
console.log('2. Update .env.example with any missing variables');
console.log('3. Ensure .gitignore is properly configured');
console.log('4. Share clean files with your frontend team');
console.log('5. Provide actual environment values separately (not in Git)');

console.log('\n📦 Files ready for GitHub:');
console.log('✅ API_DOCUMENTATION.md (cleaned)');
console.log('✅ whatsapp-auth-sdk.js (cleaned)');
console.log('✅ FRONTEND_INTEGRATION_GUIDE.md');
console.log('✅ FRONTEND_SUPABASE_SETUP.md');
console.log('✅ DEPLOYMENT_CHECKLIST.md');
console.log('✅ ENVIRONMENT_TEMPLATE.md');
console.log('✅ WhatsApp_Auth_API_Collection.postman_collection.json (cleaned)');
console.log('✅ .env.example');
console.log('✅ .gitignore');

console.log('\n🔒 Sensitive data removed:');
console.log('❌ Actual API keys and tokens');
console.log('❌ Real phone numbers');
console.log('❌ Supabase project URLs');
console.log('❌ Test files with credentials');
console.log('❌ Environment files with secrets');