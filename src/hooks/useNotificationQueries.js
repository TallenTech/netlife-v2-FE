import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";
import { addToSyncQueue } from "@/services/offlineSync";
import { logError } from "@/utils/errorHandling";

// --- QUERY HOOKS ---

export const useUserNotifications = (
  userId,
  limit = 50,
  unreadOnly = false
) => {
  return useQuery({
    queryKey: ["notifications", userId, { limit, unreadOnly }],
    queryFn: async () => {
      const { success, data, error } =
        await notificationService.getUserNotifications(
          userId,
          limit,
          unreadOnly
        );
      if (!success) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
};

export const useUnreadNotificationCount = (userId) => {
  return useQuery({
    queryKey: ["unreadNotificationCount", userId],
    queryFn: async () => {
      const { success, count, error } =
        await notificationService.getUnreadCount(userId);
      if (!success) throw new Error(error.message);
      return count;
    },
    enabled: !!userId,
  });
};

// --- MUTATION HOOKS ---

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
    onError: (error, notificationId) => {
      logError(error, "useMarkNotificationAsRead", { notificationId });
      addToSyncQueue({ type: "MARK_AS_READ", payload: { notificationId } });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => notificationService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
    onError: (error, userId) => {
      logError(error, "useMarkAllNotificationsAsRead", { userId });
      addToSyncQueue({ type: "MARK_ALL_AS_READ", payload: { userId } });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) =>
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
    onError: (error, notificationId) => {
      logError(error, "useDeleteNotification", { notificationId });
      addToSyncQueue({
        type: "DELETE_NOTIFICATION",
        payload: { notificationId },
      });
    },
  });
};
