import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState("default");

  const getExistingSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }, []);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      setPermission(Notification.permission);
      const sub = await getExistingSubscription();
      setIsSubscribed(!!sub);
    };
    checkSubscriptionStatus();
  }, [getExistingSubscription]);

  const subscribe = async () => {
    if (!user)
      return setError("You must be logged in to enable notifications.");
    if (permission === "denied")
      return setError(
        "Notification permission has been denied. Please enable it in your browser settings."
      );

    setIsSubscribing(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { error: insertError } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          subscription_details: subscription,
        });

      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      setIsSubscribed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribe = async () => {
    setIsSubscribing(true);
    setError(null);
    try {
      const sub = await getExistingSubscription();
      if (sub) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("subscription_details->>endpoint", sub.endpoint);
        await sub.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    isSubscribing,
    permission,
    error,
  };
}
