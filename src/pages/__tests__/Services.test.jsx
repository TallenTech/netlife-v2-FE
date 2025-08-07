/**
 * Tests for the Services component
 * Verifies API integration and UI behavior
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Services from "../Services";
import { servicesApi } from "@/services/servicesApi";

// --- IMPROVEMENT 1: Centralized Mock Data (DRY Principle) ---
const MOCK_SERVICES = {
  HIV: {
    id: "hts",
    name: "HIV Testing",
    description: "Quick and confidential",
    category: "routine",
    color: "red",
    icon: "Heart",
  },
  STI: {
    id: "2",
    name: "STI Screening",
    description: "Comprehensive screening",
    category: "routine",
    color: "blue",
    icon: "Shield",
  },
  PEP: {
    id: "3",
    name: "PEP Access",
    description: "Post-exposure treatment",
    category: "urgent",
    color: "yellow",
    icon: "Star",
  },
};

const MOCK_CACHED_DATA = {
  data: [
    {
      id: "cached-1",
      title: "Cached Service",
      desc: "From cache",
      category: "routine",
      color: "blue",
      icon: "Heart",
    },
  ],
  timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
};

// --- IMPROVEMENT 2: Use a Constant for localStorage Key ---
const SERVICES_CACHE_KEY = "netlife_services_cache";

// Mock the services API
jest.mock("@/services/servicesApi", () => ({
  servicesApi: {
    getServices: jest.fn(),
  },
  transformServiceData: jest.fn((service) => ({
    id: service.id,
    title: service.name,
    desc: service.description,
    category: service.category || "routine",
    color: service.color || "blue",
    icon: service.icon || "Heart",
  })),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const renderServices = () => {
  return render(
    <BrowserRouter>
      <Services />
    </BrowserRouter>
  );
};

describe("Services Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("should render loading state initially", () => {
    servicesApi.getServices.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderServices();
    expect(screen.getByText("Health Services")).toBeInTheDocument();
    expect(screen.getByText("Choose the service you need")).toBeInTheDocument();
    // A more robust check would be for loading skeletons if they have a unique test-id
    // For example: expect(screen.getAllByTestId('service-skeleton')).toHaveLength(3);
  });

  it("should fetch and display services from API", async () => {
    const mockServiceList = [MOCK_SERVICES.HIV, MOCK_SERVICES.STI];
    servicesApi.getServices.mockResolvedValue(mockServiceList);
    renderServices();
    await waitFor(() => {
      expect(screen.getByText("HIV Testing")).toBeInTheDocument();
      expect(screen.getByText("STI Screening")).toBeInTheDocument();
    });
    expect(servicesApi.getServices).toHaveBeenCalledTimes(1);
  });

  it("should handle API errors gracefully, showing a fallback message", async () => {
    servicesApi.getServices.mockRejectedValue(new Error("Network error"));
    renderServices();
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load services from server")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Showing cached services. Some may be outdated.")
      ).toBeInTheDocument();
    });
    // This assumes your component has hardcoded fallbacks or uses a stale cache
    expect(screen.getByText("HIV Testing")).toBeInTheDocument();
  });

  it("should filter services by category", async () => {
    const mockServiceList = [MOCK_SERVICES.HIV, MOCK_SERVICES.PEP];
    servicesApi.getServices.mockResolvedValue(mockServiceList);
    renderServices();
    await waitFor(() => {
      expect(screen.getByText("HIV Testing")).toBeInTheDocument();
      expect(screen.getByText("PEP Access")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Urgent"));
    expect(screen.queryByText("HIV Testing")).not.toBeInTheDocument();
    expect(screen.getByText("PEP Access")).toBeInTheDocument();
  });

  it("should navigate to service intro when Request Now is clicked", async () => {
    servicesApi.getServices.mockResolvedValue([MOCK_SERVICES.HIV]);
    renderServices();
    await waitFor(() => {
      fireEvent.click(screen.getByText("Request Now"));
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      `/services/${MOCK_SERVICES.HIV.id}/intro`
    );
  });

  it("should retry loading services when retry button is clicked", async () => {
    servicesApi.getServices
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce([MOCK_SERVICES.HIV]);
    renderServices();
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load services from server")
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => {
      expect(
        screen.queryByText("Failed to load services from server")
      ).not.toBeInTheDocument();
      expect(screen.getByText("HIV Testing")).toBeInTheDocument();
    });
    expect(servicesApi.getServices).toHaveBeenCalledTimes(2);
  });

  it("should show empty state when no services are available", async () => {
    servicesApi.getServices.mockResolvedValue([]);
    renderServices();
    await waitFor(() => {
      expect(screen.getByText("No Services Available")).toBeInTheDocument();
    });
  });

  it("should cache services in localStorage on successful fetch", async () => {
    servicesApi.getServices.mockResolvedValue([MOCK_SERVICES.HIV]);
    renderServices();
    await waitFor(() => {
      expect(screen.getByText("HIV Testing")).toBeInTheDocument();
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      SERVICES_CACHE_KEY,
      expect.stringContaining(MOCK_SERVICES.HIV.name)
    );
  });

  it("should load from cache when available and API is pending", async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(MOCK_CACHED_DATA));
    servicesApi.getServices.mockImplementation(() => new Promise(() => {})); // API never resolves
    renderServices();
    await waitFor(() => {
      expect(screen.getByText("Cached Service")).toBeInTheDocument();
    });
    // API is still called in the background to get fresh data
    expect(servicesApi.getServices).toHaveBeenCalledTimes(1);
  });
});
