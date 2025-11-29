import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ad } from '@/types/api';
import { getAdById } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format, Locale } from 'date-fns';
import { enUS, de, ru, fr, th } from 'date-fns/locale';
import { ArrowLeft, User, Calendar, Tag, DollarSign } from 'lucide-react';

interface AdDetailProps {
  adId: number;
  onBack: () => void;
}

const localeMap: Record<string, Locale> = {
  en: enUS,
  de: de,
  ru: ru,
  fr: fr,
  th: th,
};

export function AdDetail({ adId, onBack }: AdDetailProps) {
  const { t, i18n } = useTranslation();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdById(adId)
      .then(setAd)
      .catch((err) => {
        setError(err.message || t('ads.loadError'));
      })
      .finally(() => setLoading(false));
  }, [adId, t]);

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    SOLD: 'bg-blue-100 text-blue-800',
    DELETED: 'bg-red-100 text-red-800',
  };

  const formatPrice = (price: number) => {
    const localeCode = i18n.language === 'th' ? 'th-TH' : i18n.language === 'de' ? 'de-DE' : i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const currentLocale = localeMap[i18n.language] || enUS;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{error || t('ads.notFound')}</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(ad.createdAt), {
    addSuffix: true,
    locale: currentLocale,
  });

  const formattedDate = format(new Date(ad.createdAt), 'PPP', {
    locale: currentLocale,
  });

  return (
    <div className="max-w-3xl mx-auto">
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-2xl">{ad.title}</CardTitle>
            <Badge className={statusColors[ad.status] || 'bg-gray-100'}>
              {t(`ads.status.${ad.status}`)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-3xl font-bold text-primary">
            {formatPrice(ad.price)}
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {ad.categoryName && (
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4" />
                <span>{t('adDetail.category')}: {ad.categoryName}</span>
              </div>
            )}
            {ad.userName && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>{t('adDetail.seller')}: {ad.userName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{t('adDetail.posted')}: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>{timeAgo}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            <Button className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              {t('adDetail.contact')}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
