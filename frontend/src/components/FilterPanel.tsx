import { useState, useEffect } from 'react';
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

const AREAS: { value: Area; label: string }[] = [
  { value: 'THONG_SALA', label: 'Thong Sala' },
  { value: 'SRITHANU', label: 'Srithanu' },
  { value: 'HAAD_RIN', label: 'Haad Rin' },
  { value: 'BAAN_TAI', label: 'Baan Tai' },
  { value: 'BAAN_KAI', label: 'Baan Kai' },
  { value: 'CHALOKLUM', label: 'Chaloklum' },
  { value: 'MAE_HAAD', label: 'Mae Haad' },
  { value: 'SALAD', label: 'Salad' },
  { value: 'HIN_KONG', label: 'Hin Kong' },
  { value: 'WOK_TUM', label: 'Wok Tum' },
  { value: 'OTHER', label: 'Other' },
];

const PRICE_PERIODS: { value: PricePeriod; label: string }[] = [
  { value: 'DAY', label: 'Per Day' },
  { value: 'WEEK', label: 'Per Week' },
  { value: 'MONTH', label: 'Per Month' },
  { value: 'SALE', label: 'For Sale' },
];

interface FilterPanelProps {
  filters: AdSearchParams;
  onFiltersChange: (filters: AdSearchParams) => void;
  onApply: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onApply }: FilterPanelProps) {
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
      <h3 className="font-semibold text-lg">Filters</h3>
      
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={localFilters.categoryId?.toString() || 'all'}
          onValueChange={(value) => 
            handleChange('categoryId', value === 'all' ? undefined : Number(value))
          }
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
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
          <Label htmlFor="minPrice">Min Price</Label>
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
          <Label htmlFor="maxPrice">Max Price</Label>
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
        <Label htmlFor="sortBy">Sort By</Label>
        <Select
          value={`${localFilters.sortBy || 'createdAt'}-${localFilters.sortDirection || 'desc'}`}
          onValueChange={(value) => {
            const [sortBy, sortDirection] = value.split('-') as [AdSearchParams['sortBy'], AdSearchParams['sortDirection']];
            setLocalFilters((prev) => ({ ...prev, sortBy, sortDirection }));
          }}
        >
          <SelectTrigger id="sortBy">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
                        <SelectItem value="createdAt-desc">Newest First</SelectItem>
                        <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                        <SelectItem value="title-desc">Title (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
                <Button onClick={handleApply} className="flex-1">
                  Apply
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  Reset
                </Button>
      </div>
    </div>
  );
}
