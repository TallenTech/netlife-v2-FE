/**
 * Tests for the Services component
 * Verifies API integration and UI behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Services from '../Services';
import { servicesApi } from '@/services/servicesApi';

// Mock the services API
jest.mock('@/services/servicesApi', () => ({
  servicesApi: {
    getServices: jest.fn()
  },
  transformServiceData: jest.fn((service) => ({
    id: service.id,
    title: service.name,
    desc: service.description,
    category: service.category || 'routine',
    color: service.color || 'blue',
    icon: service.icon || 'Heart'
  }))
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

const renderServices = () => {
  return render(
    <BrowserRouter>
      <Services />
    </BrowserRouter>
  );
};

describe('Services Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render loading state initially', () => {
    servicesApi.getServices.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderServices();
    
    // Should show loading skeletons
    expect(screen.getByText('Health Services')).toBeInTheDocument();
    expect(screen.getByText('Choose the service you need')).toBeInTheDocument();
  });

  it('should fetch and display services from API', async () => {
    const mockServices = [
      {
        id: '1',
        name: 'HIV Testing',
        description: 'Quick and confidential',
        category: 'routine',
        color: 'red',
        icon: 'Heart'
      },
      {
        id: '2',
        name: 'STI Screening',
        description: 'Comprehensive screening',
        category: 'routine',
        color: 'blue',
        icon: 'Shield'
      }
    ];

    servicesApi.getServices.mockResolvedValue(mockServices);

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('HIV Testing')).toBeInTheDocument();
      expect(screen.getByText('STI Screening')).toBeInTheDocument();
      expect(screen.getByText('Quick and confidential')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive screening')).toBeInTheDocument();
    });

    expect(servicesApi.getServices).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    servicesApi.getServices.mockRejectedValue(new Error('Network error'));

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('Failed to load services from server')).toBeInTheDocument();
      expect(screen.getByText('Showing cached services. Some may be outdated.')).toBeInTheDocument();
    });

    // Should show fallback services
    expect(screen.getByText('HIV Testing')).toBeInTheDocument();
    expect(screen.getByText('STI Screening')).toBeInTheDocument();
  });

  it('should filter services by category', async () => {
    const mockServices = [
      {
        id: '1',
        name: 'HIV Testing',
        description: 'Quick and confidential',
        category: 'routine',
        color: 'red',
        icon: 'Heart'
      },
      {
        id: '2',
        name: 'PEP Access',
        description: 'Post-exposure treatment',
        category: 'urgent',
        color: 'yellow',
        icon: 'Star'
      }
    ];

    servicesApi.getServices.mockResolvedValue(mockServices);

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('HIV Testing')).toBeInTheDocument();
      expect(screen.getByText('PEP Access')).toBeInTheDocument();
    });

    // Click on Urgent filter
    fireEvent.click(screen.getByText('Urgent'));

    // Should only show urgent services
    expect(screen.queryByText('HIV Testing')).not.toBeInTheDocument();
    expect(screen.getByText('PEP Access')).toBeInTheDocument();
  });

  it('should navigate to service intro when Request Now is clicked', async () => {
    const mockServices = [
      {
        id: 'hts',
        name: 'HIV Testing',
        description: 'Quick and confidential',
        category: 'routine',
        color: 'red',
        icon: 'Heart'
      }
    ];

    servicesApi.getServices.mockResolvedValue(mockServices);

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('HIV Testing')).toBeInTheDocument();
    });

    // Click Request Now button
    fireEvent.click(screen.getByText('Request Now'));

    expect(mockNavigate).toHaveBeenCalledWith('/services/hts/intro');
  });

  it('should retry loading services when retry button is clicked', async () => {
    servicesApi.getServices
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([
        {
          id: '1',
          name: 'HIV Testing',
          description: 'Quick and confidential',
          category: 'routine',
          color: 'red',
          icon: 'Heart'
        }
      ]);

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('Failed to load services from server')).toBeInTheDocument();
    });

    // Click retry button
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.queryByText('Failed to load services from server')).not.toBeInTheDocument();
    });

    expect(servicesApi.getServices).toHaveBeenCalledTimes(2);
  });

  it('should show empty state when no services are available', async () => {
    servicesApi.getServices.mockResolvedValue([]);

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('No Services Available')).toBeInTheDocument();
      expect(screen.getByText('No health services are currently available.')).toBeInTheDocument();
    });
  });

  it('should cache services in localStorage', async () => {
    const mockServices = [
      {
        id: '1',
        name: 'HIV Testing',
        description: 'Quick and confidential',
        category: 'routine',
        color: 'red',
        icon: 'Heart'
      }
    ];

    servicesApi.getServices.mockResolvedValue(mockServices);

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('HIV Testing')).toBeInTheDocument();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'netlife_services_cache',
      expect.stringContaining('HIV Testing')
    );
  });

  it('should load from cache when available', async () => {
    const cachedData = {
      data: [
        {
          id: '1',
          title: 'Cached Service',
          desc: 'From cache',
          category: 'routine',
          color: 'blue',
          icon: 'Heart'
        }
      ],
      timestamp: Date.now() - 30 * 60 * 1000 // 30 minutes ago
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));
    servicesApi.getServices.mockResolvedValue([]);

    renderServices();

    await waitFor(() => {
      expect(screen.getByText('Cached Service')).toBeInTheDocument();
    });
  });
});