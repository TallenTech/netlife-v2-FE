import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { profileService } from "@/services/profileService";
import { addToSyncQueue } from "@/services/offlineSync";
import { logError } from "@/utils/errorHandling";

export const useUserSettings = (userId) => {
  return useQuery({
    queryKey: ["userSettings", userId],
    queryFn: () => settingsService.loadSettings(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 15,
  });
};

export const useDistricts = () => {
  return useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { success, data, error } = await profileService.getDistricts();
      if (!success) throw new Error(error.message);
      return data;
    },
    staleTime: Infinity,
  });
};

export const useSaveSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, settings }) =>
      settingsService.saveSettings(userId, settings),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["userSettings", variables.userId],
      });
    },
    onError: (error, variables) => {
      logError(error, "useSaveSettings", variables);
      queryClient.setQueryData(
        ["userSettings", variables.userId],
        variables.settings
      );
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: (userId) => settingsService.deleteAccount(userId),
    onError: (error, userId) => {
      logError(error, "useDeleteAccount", { userId });
    },
  });
};
