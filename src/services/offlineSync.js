import { servicesApi } from "./servicesApi";
import { logError } from "@/utils/errorHandling";

const SYNC_QUEUE_KEY = "netlife_sync_queue";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export async function addToSyncQueue(request) {
  console.log("OFFLINE: Adding request to sync queue.", request);

  const serializableRequest = { ...request };

  if (request.attachments && request.attachments instanceof File) {
    serializableRequest.attachments = {
      dataUrl: await fileToBase64(request.attachments),
      name: request.attachments.name,
      type: request.attachments.type,
    };
  }

  const queue = getSyncQueue();
  const item = { ...serializableRequest, queueId: `offline_${Date.now()}` };
  queue.push(item);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(item));
}

export function getSyncQueue() {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    logError(error, "getSyncQueue");
    localStorage.removeItem(SYNC_QUEUE_KEY);
    return [];
  }
}

export async function processSyncQueue() {
  let queue = getSyncQueue();
  if (queue.length === 0) {
    return true;
  }

  console.log(`SYNC: Processing ${queue.length} items from offline queue.`);

  const remainingItems = [];

  for (const request of queue) {
    try {
      await servicesApi.submitServiceRequestForSync(request, true);
      console.log(
        `SYNC: Successfully submitted queued request for user ${request.user_id}`
      );
    } catch (error) {
      logError(error, "processSyncQueue", { request });
      remainingItems.push(request);
    }
  }

  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingItems));

  console.log(`SYNC: ${remainingItems.length} items remaining in queue.`);
  return remainingItems.length === 0;
}
