import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Ad, AdSearchParams, PageResponse } from '@/types/api';
import { searchAds } from '@/lib/api';
import { AdList } from '@/components/AdList';
import { AdDetail } from '@/components/AdDetail';
import { AdForm } from '@/components/AdForm';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { AdPagination } from '@/components/AdPagination';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

function App() {
  const { t } = useTranslation();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | undefined>(undefined);
  
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
      setError(err instanceof Error ? err.message : t('common.error'));
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

  const handleAdClick = (ad: Ad) => {
    setSelectedAdId(ad.id);
    setViewMode('detail');
  };

  const handleCreateAd = () => {
    setEditingAd(undefined);
    setViewMode('create');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedAdId(null);
    setEditingAd(undefined);
  };

  const handleAdSaved = () => {
    handleBackToList();
    fetchAds();
  };

  const renderContent = () => {
    if (viewMode === 'detail' && selectedAdId) {
      return (
        <AdDetail
          adId={selectedAdId}
          onBack={handleBackToList}
        />
      );
    }

    if (viewMode === 'create' || viewMode === 'edit') {
      return (
        <AdForm
          ad={editingAd}
          onSave={handleAdSaved}
          onCancel={handleBackToList}
        />
      );
    }

    return (
      <>
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
                <span>{t('ads.found')}: {totalElements}</span>
              )}
            </div>
            
            <AdList ads={ads} loading={loading} onAdClick={handleAdClick} />
            
            <AdPagination
              currentPage={filters.page || 0}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 
            className="text-3xl font-bold text-gray-900 cursor-pointer"
            onClick={handleBackToList}
          >
            {t('header.title')}
          </h1>
          <div className="flex items-center gap-4">
            {viewMode === 'list' && (
              <Button onClick={handleCreateAd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('header.createAd')}
              </Button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
