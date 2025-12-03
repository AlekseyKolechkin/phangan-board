import { Link } from 'react-router-dom';
import { Ad } from '@/types/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AdCardProps {
  ad: Ad;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const FILES_URL = API_URL.replace('/api', '');

export function AdCard({ ad }: AdCardProps) {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    SOLD: 'bg-blue-100 text-blue-800',
    DELETED: 'bg-red-100 text-red-800',
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const timeAgo = formatDistanceToNow(new Date(ad.createdAt), {
    addSuffix: true,
    locale: ru,
  });

  const mainImage = ad.images?.[0];

  return (
    <Link to={`/ad/${ad.id}`} className="block">
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
        {mainImage && (
          <img
            src={`${FILES_URL}${mainImage.url}`}
            className="w-full h-48 object-cover rounded-t-lg"
            alt={ad.title}
          />
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg line-clamp-2">{ad.title}</CardTitle>
            <Badge className={statusColors[ad.status] || 'bg-gray-100'}>
              {ad.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
            {ad.description}
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatPrice(ad.price)}
          </p>
        </CardContent>
        <CardFooter className="pt-2 border-t flex justify-between text-sm text-gray-500">
          <div className="flex flex-col gap-1">
            {ad.categoryName && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {ad.categoryName}
              </span>
            )}
          </div>
          <div className="text-right">
            {ad.userName && <p className="text-xs">{ad.userName}</p>}
            <p className="text-xs">{timeAgo}</p>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
