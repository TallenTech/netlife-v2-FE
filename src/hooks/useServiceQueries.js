import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/services/servicesApi";
import { addToSyncQueue } from "@/services/offlineSync";
import { logError } from "@/utils/errorHandling";

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getServices,
  });
};

export const useUserServiceRequests = (userId) => {
  return useQuery({
    queryKey: ['serviceRequests', userId],
    queryFn: () => servicesApi.getUserServiceRequests(userId),
    enabled: !!userId, 
  });
};

export const useSubmitServiceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servicesApi.submitServiceRequest,
    
    onMutate: async (newRequest) => {
      await queryClient.cancelQueries({ queryKey: ["serviceRequests", newRequest.user_id] });
      const previousRequests = queryClient.getQueryData(["serviceRequests", newRequest.user_id]);

      const optimisticRequest = {
        ...newRequest,
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        status: "pending",
        isOffline: true, 
        services: {
          name: "Processing...", 
          slug: "",
        },
      };

      queryClient.setQueryData(
        ["serviceRequests", newRequest.user_id],
        (old) => [optimisticRequest, ...(old || [])]
      );

      return { previousRequests };
    },

    onError: (error, newRequest, context) => {
      console.warn("Online submission failed, queuing for offline sync.", error);
      addToSyncQueue(newRequest);
    },

    onSettled: (data, error, newRequest) => {
      console.log("Submission settled. Invalidating queries to get fresh data.");
      queryClient.invalidateQueries({ queryKey: ["serviceRequests", newRequest.user_id] });
    },
  });
};