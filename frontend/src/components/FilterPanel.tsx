import { useState, useEffect } from 'react';
import { Category, AdSearchParams } from '@/types/api';
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
      <h3 className="font-semibold text-lg">Фильтры</h3>
      
      <div className="space-y-2">
        <Label htmlFor="category">Категория</Label>
        <Select
          value={localFilters.categoryId?.toString() || 'all'}
          onValueChange={(value) => 
            handleChange('categoryId', value === 'all' ? undefined : Number(value))
          }
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="minPrice">Цена от</Label>
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
          <Label htmlFor="maxPrice">Цена до</Label>
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
        <Label htmlFor="sortBy">Сортировка</Label>
        <Select
          value={`${localFilters.sortBy || 'createdAt'}-${localFilters.sortDirection || 'desc'}`}
          onValueChange={(value) => {
            const [sortBy, sortDirection] = value.split('-') as [AdSearchParams['sortBy'], AdSearchParams['sortDirection']];
            setLocalFilters((prev) => ({ ...prev, sortBy, sortDirection }));
          }}
        >
          <SelectTrigger id="sortBy">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Сначала новые</SelectItem>
            <SelectItem value="createdAt-asc">Сначала старые</SelectItem>
            <SelectItem value="price-asc">Сначала дешевые</SelectItem>
            <SelectItem value="price-desc">Сначала дорогие</SelectItem>
            <SelectItem value="title-asc">По названию (А-Я)</SelectItem>
            <SelectItem value="title-desc">По названию (Я-А)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleApply} className="flex-1">
          Применить
        </Button>
        <Button onClick={handleReset} variant="outline" className="flex-1">
          Сбросить
        </Button>
      </div>
    </div>
  );
}
