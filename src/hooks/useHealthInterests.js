import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthInterestsService } from '@/services/healthInterestsService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to manage health interests
 */
export function useHealthInterests() {
    const { activeProfile } = useAuth();
    const queryClient = useQueryClient();

    // Get all available health interests
    const {
        data: availableInterests,
        isLoading: isLoadingAvailable,
        error: availableError,
        refetch: refetchAvailable
    } = useQuery({
        queryKey: ['health-interests', 'available'],
        queryFn: healthInterestsService.getAvailableHealthInterests,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    // Get user's current health interests
    const {
        data: userInterests,
        isLoading: isLoadingUser,
        error: userError,
        refetch: refetchUser
    } = useQuery({
        queryKey: ['health-interests', 'user', activeProfile?.id],
        queryFn: () => healthInterestsService.getUserHealthInterests(activeProfile?.id),
        enabled: !!activeProfile?.id,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    });

    // Update user's health interests
    const updateUserInterestsMutation = useMutation({
        mutationFn: ({ interests }) =>
            healthInterestsService.updateUserHealthInterests(activeProfile?.id, interests),
        onSuccess: () => {
            // Invalidate and refetch user interests
            queryClient.invalidateQueries({
                queryKey: ['health-interests', 'user', activeProfile?.id]
            });

            // Also invalidate profile data since health_interests is stored there
            queryClient.invalidateQueries({
                queryKey: ['profile', activeProfile?.id]
            });
        },
    });

    // Get available interests as a simple array for the UI
    const availableInterestsArray = availableInterests?.data?.map(item => item.category_name) || [];

    // Get user's selected interests as a simple array
    const userSelectedInterests = userInterests?.data?.simple || [];

    // Check if an interest is selected
    const isInterestSelected = (interestName) => {
        return userSelectedInterests.includes(interestName);
    };

    // Toggle an interest
    const toggleInterest = (interestName) => {
        const currentInterests = [...userSelectedInterests];
        const index = currentInterests.indexOf(interestName);

        if (index > -1) {
            currentInterests.splice(index, 1);
        } else {
            currentInterests.push(interestName);
        }

        return currentInterests;
    };

    // Update interests
    const updateInterests = async (interests) => {
        return updateUserInterestsMutation.mutateAsync({ interests });
    };

    // Get interests as simple array of categories
    const getInterestsList = () => {
        if (!availableInterests?.data) return [];
        
        return availableInterests.data.map(item => ({
            name: item.category_name,
            description: item.category_description,
            color: item.category_color,
            isSelected: isInterestSelected(item.category_name)
        }));
    };

    return {
        // Data
        availableInterests: availableInterests?.data || [],
        availableInterestsArray,
        userInterests: userInterests?.data || {},
        userSelectedInterests,
        interestsList: getInterestsList(),

        // Loading states
        isLoadingAvailable,
        isLoadingUser,
        isLoading: isLoadingAvailable || isLoadingUser,
        isUpdating: updateUserInterestsMutation.isPending,

        // Errors
        availableError,
        userError,
        updateError: updateUserInterestsMutation.error,

        // Actions
        isInterestSelected,
        toggleInterest,
        updateInterests,
        refetchAvailable,
        refetchUser,

        // Mutation
        updateUserInterestsMutation
    };
}
