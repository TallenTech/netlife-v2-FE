import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/services/servicesApi";
import { addToSyncQueue } from "@/services/offlineSync";
import { logError } from "@/utils/errorHandling";

export const useServices = () =>
  useQuery({
    queryKey: ["services"],
    queryFn: servicesApi.getServices,
  });

export const useServiceBySlug = (slug) =>
  useQuery({
    queryKey: ["service", slug],
    queryFn: () => servicesApi.getServiceBySlug(slug),
    enabled: !!slug,
  });

export const useServiceQuestions = (serviceSlug) => {
  const { data: service } = useServiceBySlug(serviceSlug);
  const serviceId = service?.id;
  return useQuery({
    queryKey: ["serviceQuestions", serviceId],
    queryFn: () => servicesApi.getServiceQuestions(serviceId),
    enabled: !!serviceId,
  });
};

export const useQuestionOptions = (questionId) =>
  useQuery({
    queryKey: ["questionOptions", questionId],
    queryFn: () => servicesApi.getQuestionOptions(questionId),
    enabled: !!questionId,
  });

export const useUserServiceRequests = (userId) =>
  useQuery({
    queryKey: ["serviceRequests", userId],
    queryFn: () => servicesApi.getUserServiceRequests(userId),
    enabled: !!userId,
  });

export const useUserScreeningResults = (userId) =>
  useQuery({
    queryKey: ["screeningResults", userId],
    queryFn: () => servicesApi.getUserScreeningResults(userId),
    enabled: !!userId,
  });

export const useVideos = () =>
  useQuery({
    queryKey: ["videos"],
    queryFn: servicesApi.getVideos,
  });

export const useVideoById = (videoId) =>
  useQuery({
    queryKey: ["video", videoId],
    queryFn: () => servicesApi.getVideoById(videoId),
    enabled: !!videoId,
  });

// --- START OF THE MAIN FIX ---

export const useSubmitServiceRequest = ({ onSuccess, onError } = {}) => {
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
        attachments: newRequest.attachments
          ? {
              name: newRequest.attachments.name,
              size: newRequest.attachments.size,
            }
          : null,
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        status: "pending",
        isOffline: true,
        services: { name: "Processing...", slug: "" },
      };
      queryClient.setQueryData(
        ["serviceRequests", newRequest.user_id],
        (old) => [optimisticRequest, ...(old || [])]
      );
      return { previousRequests };
    },

    // This callback runs when the mutationFn succeeds
    onSuccess: (data) => {
      console.log(
        "Mutation successful, calling the onSuccess callback from the component."
      );
      if (onSuccess) onSuccess(data);
    },

    // This callback runs when the mutationFn fails
    onError: (error, newRequest, context) => {
      console.warn(
        "Mutation failed, reverting optimistic update and calling the onError callback.",
        error
      );
      if (context?.previousRequests) {
        queryClient.setQueryData(
          ["serviceRequests", newRequest.user_id],
          context.previousRequests
        );
      }
      addToSyncQueue(newRequest); // Simplified offline handling
      logError(error, "useSubmitServiceRequest:onError", {
        request: newRequest,
      });
      if (onError) onError(error);
    },

    // This callback runs after success or error
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

// --- END OF THE MAIN FIX ---

export const useDeleteServiceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId) => servicesApi.deleteServiceRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceRequests"] });
    },
    onError: (error, requestId) => {
      console.warn("Deleting request failed, queuing.", error);
      addToSyncQueue({
        type: "DELETE_SERVICE_REQUEST",
        payload: { requestId },
      });
    },
  });
};

export const useSaveScreeningAnswers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers) => servicesApi.saveScreeningAnswers(answers),
    onSuccess: (data, variables) => {
      const userId = variables[0]?.user_id;
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["screeningResults", userId],
        });
      }
    },
    onError: (error, variables) => {
      console.warn("Saving answers failed, queuing.", error);
      addToSyncQueue({ type: "SAVE_SCREENING_ANSWERS", payload: variables });
    },
  });
};

export const useSaveScreeningResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (result) => servicesApi.saveScreeningResult(result),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["screeningResults", variables.user_id],
      });
    },
    onError: (error, variables) => {
      console.warn("Saving result failed, queuing.", error);
      addToSyncQueue({ type: "SAVE_SCREENING_RESULT", payload: variables });
    },
  });
};

export const useDeleteScreeningResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resultId) => servicesApi.deleteScreeningResult(resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screeningResults"] });
    },
    onError: (error, resultId) => {
      console.warn("Deleting result failed, queuing.", error);
      addToSyncQueue({
        type: "DELETE_SCREENING_RESULT",
        payload: { resultId },
      });
    },
  });
};
