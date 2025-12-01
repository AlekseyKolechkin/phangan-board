import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchAds } from '@/lib/api';

describe('API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('searchAds', () => {
    it('calls API with correct query parameters for category filter', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, page: 0, size: 20 }),
      });

      await searchAds({ categoryId: 1 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('categoryId=1'),
        expect.any(Object)
      );
    });

    it('calls API with correct query parameters for area filter', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, page: 0, size: 20 }),
      });

      await searchAds({ area: 'THONG_SALA' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('area=THONG_SALA'),
        expect.any(Object)
      );
    });

    it('calls API with correct query parameters for pricePeriod filter', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, page: 0, size: 20 }),
      });

      await searchAds({ pricePeriod: 'MONTH' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pricePeriod=MONTH'),
        expect.any(Object)
      );
    });

    it('calls API with correct query parameters for price range filter', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, page: 0, size: 20 }),
      });

      await searchAds({ minPrice: 100, maxPrice: 500 });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('minPrice=100');
      expect(fetchCall).toContain('maxPrice=500');
    });

    it('calls API with correct query parameters for search query', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, page: 0, size: 20 }),
      });

      await searchAds({ q: 'test search' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test+search'),
        expect.any(Object)
      );
    });

    it('calls API with correct query parameters for pagination', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, page: 0, size: 20 }),
      });

      await searchAds({ page: 2, size: 10 });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('page=2');
      expect(fetchCall).toContain('size=10');
    });

    it('calls API with multiple filters combined', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, page: 0, size: 20 }),
      });

      await searchAds({
        categoryId: 1,
        area: 'HAAD_RIN',
        pricePeriod: 'WEEK',
        minPrice: 100,
        maxPrice: 1000,
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('categoryId=1');
      expect(fetchCall).toContain('area=HAAD_RIN');
      expect(fetchCall).toContain('pricePeriod=WEEK');
      expect(fetchCall).toContain('minPrice=100');
      expect(fetchCall).toContain('maxPrice=1000');
    });
  });
});
