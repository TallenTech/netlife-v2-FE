/**
 * Test utility to verify service mapping works correctly
 */

import { transformServiceData } from '@/services/servicesApi';

// Sample database services (what we expect from your database)
const sampleDatabaseServices = [
    { id: '1', name: 'HIV Testing', description: 'Quick and confidential', created_at: '2024-01-01' },
    { id: '2', name: 'STI Screening', description: 'Comprehensive screening', created_at: '2024-01-02' },
    { id: '3', name: 'PrEP Access', description: 'Prevention medication', created_at: '2024-01-03' },
    { id: '4', name: 'PEP Access', description: 'Post-exposure treatment', created_at: '2024-01-04' },
    { id: '5', name: 'ART Support', description: 'Treatment support', created_at: '2024-01-05' },
    { id: '6', name: 'Counseling', description: 'Professional guidance', created_at: '2024-01-06' }
];

/**
 * Test the service transformation mapping
 */
export const testServiceMapping = () => {
    console.log('🧪 Testing service mapping...');

    const transformedServices = sampleDatabaseServices.map(service => {
        const transformed = transformServiceData(service);
        console.log(`📋 ${service.name}:`, {
            category: transformed.category,
            color: transformed.color,
            icon: transformed.icon
        });
        return transformed;
    });

    console.log('✅ Service mapping test complete');
    return transformedServices;
};

// Test unknown service mapping
export const testUnknownService = () => {
    console.log('🧪 Testing unknown service mapping...');

    const unknownService = {
        id: '999',
        name: 'Unknown Service',
        description: 'This service is not in our mapping',
        created_at: '2024-01-01'
    };

    const transformed = transformServiceData(unknownService);
    console.log('📋 Unknown service mapped to:', {
        category: transformed.category,
        color: transformed.color,
        icon: transformed.icon
    });

    return transformed;
};

// Make test functions available globally
if (typeof window !== 'undefined') {
    window.testServiceMapping = testServiceMapping;
    window.testUnknownService = testUnknownService;
}