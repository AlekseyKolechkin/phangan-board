import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Category, AdSearchParams, Area, PricePeriod } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategories } from '@/lib/api';
import { AREAS, PRICE_PERIODS } from '@/lib/constants';

interface FilterPanelProps {
  filters: AdSearchParams;
  onFiltersChange: (filters: AdSearchParams) => void;
  onApply: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onApply }: FilterPanelProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [localFilters, setLocalFilters] = useState<AdSearchParams>(filters);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof AdSearchParams, value: string | number | undefined) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
  };

  const handleReset = () => {
    const resetFilters: AdSearchParams = {
      page: 0,
      size: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onApply();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <h3 className="font-semibold text-lg">{t('filters.title')}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="category">{t('filters.category')}</Label>
        <Select
          value={localFilters.categoryId?.toString() || 'all'}
          onValueChange={(value) => 
            handleChange('categoryId', value === 'all' ? undefined : Number(value))
          }
        >
          <SelectTrigger id="category">
            <SelectValue placeholder={t('filters.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="area">Area</Label>
        <Select
          value={localFilters.area || 'all'}
          onValueChange={(value) =>
            handleChange('area', value === 'all' ? undefined : value as Area)
          }
        >
          <SelectTrigger id="area">
            <SelectValue placeholder="All areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {AREAS.map((area) => (
              <SelectItem key={area.value} value={area.value}>
                {area.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricePeriod">Price Period</Label>
        <Select
          value={localFilters.pricePeriod || 'all'}
          onValueChange={(value) =>
            handleChange('pricePeriod', value === 'all' ? undefined : value as PricePeriod)
          }
        >
          <SelectTrigger id="pricePeriod">
            <SelectValue placeholder="All periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All periods</SelectItem>
            {PRICE_PERIODS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="minPrice">{t('filters.priceFrom')}</Label>
          <Input
            id="minPrice"
            type="number"
            min="0"
            value={localFilters.minPrice || ''}
            onChange={(e) => 
              handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPrice">{t('filters.priceTo')}</Label>
          <Input
            id="maxPrice"
            type="number"
            min="0"
            value={localFilters.maxPrice || ''}
            onChange={(e) => 
              handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="∞"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortBy">{t('filters.sorting')}</Label>
        <Select
          value={`${localFilters.sortBy || 'createdAt'}-${localFilters.sortDirection || 'desc'}`}
          onValueChange={(value) => {
            const [sortBy, sortDirection] = value.split('-') as [AdSearchParams['sortBy'], AdSearchParams['sortDirection']];
            setLocalFilters((prev) => ({ ...prev, sortBy, sortDirection }));
          }}
        >
          <SelectTrigger id="sortBy">
            <SelectValue placeholder={t('filters.sorting')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">{t('filters.newestFirst')}</SelectItem>
            <SelectItem value="createdAt-asc">{t('filters.oldestFirst')}</SelectItem>
            <SelectItem value="price-asc">{t('filters.cheapestFirst')}</SelectItem>
            <SelectItem value="price-desc">{t('filters.expensiveFirst')}</SelectItem>
            <SelectItem value="title-asc">{t('filters.titleAZ')}</SelectItem>
            <SelectItem value="title-desc">{t('filters.titleZA')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={handleApply} className="flex-1 min-w-0">
          <span className="truncate">{t('common.apply')}</span>
        </Button>
        <Button onClick={handleReset} variant="outline" className="flex-1 min-w-0">
          <span className="truncate">{t('common.reset')}</span>
        </Button>
      </div>
    </div>
  );
}
