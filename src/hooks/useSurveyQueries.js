import { useQuery } from "@tanstack/react-query";
import { surveyService } from "@/services/surveyService";

/**
 * A hook to fetch and cache the survey status for a given user.
 * @param {string} userId - The ID of the user to check the survey status for.
 */
export const useSurveyStatus = (userId) => {
  return useQuery({
    // The query key includes the user ID to ensure each user's status is cached separately.
    queryKey: ["surveyStatus", userId],

    // The query function calls the actual API method.
    queryFn: () => surveyService.getSurveyStatus(userId),

    // This query will only run if the userId is available.
    enabled: !!userId,
    staleTime: 1000 * 60 * 15,
  });
};
