import { useTranslation } from 'react-i18next';
import { Ad } from '@/types/api';
import { AdCard } from './AdCard';

interface AdListProps {
  ads: Ad[];
  loading?: boolean;
  onAdClick?: (ad: Ad) => void;
}

export function AdList({ ads, loading, onAdClick }: AdListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('ads.notFound')}</p>
        <p className="text-gray-400 text-sm mt-2">
          {t('ads.tryDifferentSearch')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} onClick={onAdClick} />
      ))}
    </div>
  );
}
