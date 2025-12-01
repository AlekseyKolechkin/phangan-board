import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterPanel } from '@/components/FilterPanel';
import { AdSearchParams } from '@/types/api';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  getCategories: vi.fn(),
}));

describe('FilterPanel', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnApply = vi.fn();
  const defaultFilters: AdSearchParams = {
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getCategories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Housing', description: null },
      { id: 2, name: 'Jobs', description: null },
    ]);
  });

  it('renders filter panel with all filter options', async () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByText('Price Period')).toBeInTheDocument();
    expect(screen.getByText('Min Price')).toBeInTheDocument();
    expect(screen.getByText('Max Price')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('calls onFiltersChange and onApply when Apply button is clicked', async () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    );

    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    expect(mockOnFiltersChange).toHaveBeenCalled();
    expect(mockOnApply).toHaveBeenCalled();
  });

  it('resets filters when Reset button is clicked', async () => {
    const filtersWithValues: AdSearchParams = {
      ...defaultFilters,
      minPrice: 100,
      maxPrice: 500,
      categoryId: 1,
    };

    render(
      <FilterPanel
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    );

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 0,
        size: 20,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
    );
    expect(mockOnApply).toHaveBeenCalled();
  });

  it('updates min price input', async () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    );

    const minPriceInput = screen.getByPlaceholderText('0');
    fireEvent.change(minPriceInput, { target: { value: '100' } });

    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minPrice: 100,
      })
    );
  });
});
