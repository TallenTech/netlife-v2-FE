import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invitationService } from '@/services/invitationService';

export const useReferralCode = () => {
    const [searchParams] = useSearchParams();
    const [referralCode, setReferralCode] = useState(null);

    useEffect(() => {
        const refCode = searchParams.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            // Store in localStorage for later use during signup
            localStorage.setItem('netlife_referral_code', refCode);
        }
    }, [searchParams]);

    const processReferralCode = async (newUserId) => {
        if (!referralCode) return { success: false, error: 'No referral code found' };

        try {
            const result = await invitationService.processReferralCode(referralCode, newUserId);
            if (result.success) {
                // Clear the referral code after successful processing
                localStorage.removeItem('netlife_referral_code');
                setReferralCode(null);
            }
            return result;
        } catch (error) {
            console.error('Error processing referral code:', error);
            return { success: false, error };
        }
    };

    const getStoredReferralCode = () => {
        return localStorage.getItem('netlife_referral_code');
    };

    return {
        referralCode,
        processReferralCode,
        getStoredReferralCode
    };
};
