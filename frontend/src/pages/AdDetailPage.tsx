import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ad } from '@/types/api';
import { getAdById, ApiError } from '@/lib/api';
import { AREAS, PRICE_PERIODS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const FILES_URL = API_URL.replace('/api', '');

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SOLD: 'bg-blue-100 text-blue-800',
  DELETED: 'bg-red-100 text-red-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

export function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>();

  // Sync lightbox carousel with the clicked image index
  useEffect(() => {
    if (lightboxApi && lightboxOpen) {
      lightboxApi.scrollTo(lightboxIndex);
    }
  }, [lightboxApi, lightboxIndex, lightboxOpen]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || !lightboxApi) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        lightboxApi.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        lightboxApi.scrollNext();
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxApi]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getAdById(Number(id))
      .then(setAd)
      .catch((err) => {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load ad');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAreaLabel = (areaValue: string | null) => {
    if (!areaValue) return null;
    return AREAS.find((a) => a.value === areaValue)?.label || areaValue;
  };

  const getPricePeriodLabel = (periodValue: string | null) => {
    if (!periodValue) return null;
    return PRICE_PERIODS.find((p) => p.value === periodValue)?.label || periodValue;
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-96 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </main>
    );
  }

  if (error || !ad) {
    return (
      <main className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Ad not found'}
        </div>
        <Link to="/">
          <Button variant="outline">&larr; Back to listings</Button>
        </Link>
      </main>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(ad.createdAt), {
    addSuffix: true,
    locale: ru,
  });

  const hasImages = ad.images && ad.images.length > 0;

  return (
    <main className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to listings
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Image Carousel */}
          {hasImages && (
            <div className="mb-6">
              <Carousel className="w-full max-w-2xl mx-auto">
                <CarouselContent>
                  {ad.images!.map((image, index) => (
                    <CarouselItem key={image.id}>
                      <div
                        className="aspect-video relative cursor-pointer"
                        onClick={() => openLightbox(index)}
                      >
                        <img
                          src={`${FILES_URL}${image.url}`}
                          alt={`${ad.title} - Image ${index + 1}`}
                          className="w-full h-full object-contain rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            Click to enlarge
                          </span>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {ad.images!.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
              {ad.images!.length > 1 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  {ad.images!.length} images • Click to view full size
                </p>
              )}
            </div>
          )}

          {/* Title and Status */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <h1 className="text-2xl font-bold">{ad.title}</h1>
            <Badge className={STATUS_COLORS[ad.status] || 'bg-gray-100'}>
              {ad.status}
            </Badge>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-primary">
              {formatPrice(ad.price)}
              {ad.pricePeriod && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  {getPricePeriodLabel(ad.pricePeriod)}
                </span>
              )}
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {ad.categoryName && (
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium">{ad.categoryName}</span>
              </div>
            )}
            {ad.area && (
              <div>
                <span className="text-gray-500">Area:</span>
                <span className="ml-2 font-medium">{getAreaLabel(ad.area)}</span>
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="border-t pt-4 text-sm text-gray-500">
            <p>Posted {timeAgo}</p>
            {ad.userName && <p>By: {ad.userName}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      {hasImages && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black/95 border-none">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>

            {/* Left clickable area */}
            {ad.images!.length > 1 && (
              <button
                onClick={() => lightboxApi?.scrollPrev()}
                className="absolute left-0 top-0 w-1/4 h-full z-40 flex items-center justify-start pl-4 cursor-pointer group"
                aria-label="Previous image"
              >
                <div className="bg-white/10 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="h-8 w-8 text-white" />
                </div>
              </button>
            )}

            {/* Right clickable area */}
            {ad.images!.length > 1 && (
              <button
                onClick={() => lightboxApi?.scrollNext()}
                className="absolute right-0 top-0 w-1/4 h-full z-40 flex items-center justify-end pr-4 cursor-pointer group"
                aria-label="Next image"
              >
                <div className="bg-white/10 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-8 w-8 text-white" />
                </div>
              </button>
            )}

            {/* Image carousel */}
            <div className="flex items-center justify-center w-full h-full">
              <Carousel
                className="w-full max-w-5xl"
                setApi={setLightboxApi}
                opts={{ startIndex: lightboxIndex }}
              >
                <CarouselContent>
                  {ad.images!.map((image, index) => (
                    <CarouselItem key={image.id}>
                      <div className="flex items-center justify-center h-screen px-16">
                        <img
                          src={`${FILES_URL}${image.url}`}
                          alt={`${ad.title} - Image ${index + 1}`}
                          className="max-w-full max-h-[90vh] object-contain"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Navigation hint */}
            {ad.images!.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                Use ← → keys or click sides to navigate • {ad.images!.length} images
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}

