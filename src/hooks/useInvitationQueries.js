import { useQuery } from '@tanstack/react-query';
import { invitationService } from '@/services/invitationService';

/**
 * Hook to get invitation statistics for a user
 * @param {string} userId - The user's ID
 * @returns {Object} - Query result with invitation stats
 */
export const useInvitationStats = (userId) => {
    return useQuery({
        queryKey: ['invitationStats', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await invitationService.getInvitationStats(userId);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to fetch invitation stats');
            }
            return result.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    });
};

/**
 * Hook to get user referral data
 * @param {string} userId - The user's ID
 * @returns {Object} - Query result with referral data
 */
export const useUserReferralData = (userId) => {
    return useQuery({
        queryKey: ['userReferralData', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await invitationService.getUserReferralData(userId);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to fetch referral data');
            }
            return result.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
