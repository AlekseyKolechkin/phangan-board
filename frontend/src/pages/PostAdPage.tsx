import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ad, AdCreateRequest, Area, PricePeriod, Category } from '@/types/api';
import { createAd, getCategories, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  categoryId?: string;
}

export function PostAdPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAd, setCreatedAd] = useState<Ad | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<AdCreateRequest>({
    title: '',
    description: '',
    price: 0,
    categoryId: 0,
    userId: 1,
  });

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message));
  }, []);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (formData.price < 0) {
      errors.price = 'Price cannot be negative';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ad = await createAd(formData);
      setCreatedAd(ad);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create ad');
      }
    } finally {
      setLoading(false);
    }
  };

  if (createdAd) {
    const editUrl = `${window.location.origin}/edit/${createdAd.editToken}`;
    
    return (
      <main className="max-w-2xl mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Ad Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{createdAd.title}</h3>
              <p className="text-gray-600 mt-2">{createdAd.description}</p>
              <p className="text-xl font-bold mt-2">
                {createdAd.price.toLocaleString()} THB
                {createdAd.pricePeriod && ` / ${createdAd.pricePeriod.toLowerCase()}`}
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="font-semibold text-yellow-800 mb-2">
                Save this link to edit your ad later:
              </p>
              <div className="flex items-center gap-2">
                <Input 
                  value={editUrl} 
                  readOnly 
                  className="flex-grow font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(editUrl)}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
              <Link to="/post">
                <Button onClick={() => {
                  setCreatedAd(null);
                  setFormData({
                    title: '',
                    description: '',
                    price: 0,
                    categoryId: 0,
                    userId: 1,
                  });
                }}>
                  Post Another Ad
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to listings
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Post a New Ad</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ad title"
                className={formErrors.title ? 'border-red-500' : ''}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your item or service"
                rows={4}
                className={`w-full px-3 py-2 border rounded-md ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (THB)</label>
                <Input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  className={formErrors.price ? 'border-red-500' : ''}
                />
                {formErrors.price && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Price Period</label>
                <Select
                  value={formData.pricePeriod || ''}
                  onValueChange={(value) => setFormData({ ...formData, pricePeriod: value as PricePeriod })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <Select
                  value={formData.categoryId ? String(formData.categoryId) : ''}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: Number(value) })}
                >
                  <SelectTrigger className={formErrors.categoryId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.categoryId}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Area</label>
                <Select
                  value={formData.area || ''}
                  onValueChange={(value) => setFormData({ ...formData, area: value as Area })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Post Ad'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
