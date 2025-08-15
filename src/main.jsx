import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import "@/index.css";

// 1. Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
