import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdList } from '@/components/AdList';
import { Ad } from '@/types/api';

const mockAds: Ad[] = [
  {
    id: 1,
    title: 'Test Ad 1',
    description: 'Description for test ad 1',
    price: 1000,
    categoryId: 1,
    categoryName: 'Housing',
    userId: 1,
    userName: 'John Doe',
    status: 'ACTIVE',
    area: 'THONG_SALA',
    pricePeriod: 'MONTH',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Test Ad 2',
    description: 'Description for test ad 2',
    price: 500,
    categoryId: 2,
    categoryName: 'Jobs',
    userId: 2,
    userName: 'Jane Doe',
    status: 'ACTIVE',
    area: 'HAAD_RIN',
    pricePeriod: 'DAY',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('AdList', () => {
  it('renders loading state with skeleton placeholders', () => {
    render(<AdList ads={[]} loading={true} />);
    
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no ads', () => {
    render(<AdList ads={[]} loading={false} />);
    
    expect(screen.getByText(/Объявления не найдены/i)).toBeInTheDocument();
  });

  it('renders list of ads', () => {
    render(<AdList ads={mockAds} loading={false} />);
    
    expect(screen.getByText('Test Ad 1')).toBeInTheDocument();
    expect(screen.getByText('Test Ad 2')).toBeInTheDocument();
  });

  it('displays ad prices with Thai Baht symbol', () => {
    render(<AdList ads={mockAds} loading={false} />);
    
    expect(screen.getByText(/1 000 ฿/)).toBeInTheDocument();
    expect(screen.getByText(/500 ฿/)).toBeInTheDocument();
  });

  it('displays category names', () => {
    render(<AdList ads={mockAds} loading={false} />);
    
    expect(screen.getByText('Housing')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });
});
