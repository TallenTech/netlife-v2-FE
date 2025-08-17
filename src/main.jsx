import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import App from "@/App";
import "@/index.css";
// Import video count sync utility (available in browser console)
import "@/utils/syncVideoCounts";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: localStoragePersister }}
        >
          <App />
        </PersistQueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
