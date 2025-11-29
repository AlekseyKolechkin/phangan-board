import { useState, useEffect, useCallback } from 'react';
import { Ad, AdSearchParams, PageResponse } from '@/types/api';
import { searchAds } from '@/lib/api';
import { AdList } from '@/components/AdList';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { AdPagination } from '@/components/AdPagination';

function App() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [filters, setFilters] = useState<AdSearchParams>({
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    status: 'ACTIVE',
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: AdSearchParams = {
        ...filters,
        q: searchQuery || undefined,
      };
      
      const response: PageResponse<Ad> = await searchAds(params);
      setAds(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке объявлений');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 0 }));
  };

  const handleFiltersChange = (newFilters: AdSearchParams) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Доска объявлений
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApply={fetchAds}
            />
          </aside>
          
          <div className="flex-grow">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4 text-sm text-gray-500">
              {!loading && (
                <span>Найдено объявлений: {totalElements}</span>
              )}
            </div>
            
            <AdList ads={ads} loading={loading} />
            
            <AdPagination
              currentPage={filters.page || 0}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
