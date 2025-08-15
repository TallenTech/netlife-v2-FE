import { useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/services/servicesApi";
import { addToSyncQueue } from "@/services/offlineSync";
import { logError } from "@/utils/errorHandling";

export const useSubmitServiceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servicesApi.submitServiceRequest,
    onMutate: async (newRequest) => {
      await queryClient.cancelQueries({
        queryKey: ["serviceRequests", newRequest.user_id],
      });
      const previousRequests = queryClient.getQueryData([
        "serviceRequests",
        newRequest.user_id,
      ]);
      const optimisticRequest = {
        ...newRequest,
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        status: "pending",
        isOffline: true,
        services: {
          name: "Loading service...",
          slug: "",
        },
      };

      // D. Optimistically update the cache with the new request.
      queryClient.setQueryData(
        ["serviceRequests", newRequest.user_id],
        (old) => [optimisticRequest, ...(old || [])]
      );

      // E. Return a context object with the snapshotted value.
      return { previousRequests };
    },

    // 2. If the mutation fails (i.e., we are offline)...
    onError: (error, newRequest, context) => {
      console.warn(
        "Online submission failed, queuing for offline sync.",
        error
      );

      addToSyncQueue(newRequest);
      logError(error, "useSubmitServiceRequest:onError", {
        request: newRequest,
      });
    },

    // 3. This function runs *after* the mutation succeeds or fails.
    onSettled: (data, error, newRequest) => {
      console.log(
        "Submission settled. Invalidating queries to get fresh data."
      );
      queryClient.invalidateQueries({
        queryKey: ["serviceRequests", newRequest.user_id],
      });
    },
  });
};
