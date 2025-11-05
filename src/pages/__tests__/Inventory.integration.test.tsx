import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Inventory from '../pages/Inventory';

// Mock the hooks
vi.mock('../../hooks/useInventory', () => ({
  useInventory: () => ({
    items: [
      { id: '1', name: 'Test Item', quantity: 10, warehouseId: 'w1' },
      { id: '2', name: 'Another Item', quantity: 5, warehouseId: 'w1' },
    ],
    loading: false,
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  }),
}));

vi.mock('../../hooks/useWarehouse', () => ({
  useWarehouse: () => ({
    warehouses: [{ id: 'w1', name: 'Warehouse 1' }],
    selectedWarehouse: { id: 'w1', name: 'Warehouse 1' },
    selectWarehouse: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Inventory Integration Tests', () => {
  it('should render inventory items', async () => {
    render(<Inventory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('Another Item')).toBeInTheDocument();
    });
  });

  it('should filter items by search', async () => {
    const user = userEvent.setup();
    render(<Inventory />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Test');

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.queryByText('Another Item')).not.toBeInTheDocument();
    });
  });

  it('should open add item dialog', async () => {
    const user = userEvent.setup();
    render(<Inventory />, { wrapper: createWrapper() });

    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/create item/i)).toBeInTheDocument();
    });
  });
});

