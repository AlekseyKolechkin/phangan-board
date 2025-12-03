import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ad, AdCreateRequest, Area, PricePeriod, Category } from '@/types/api';
import { createAd, getCategories, uploadAdImages, ApiError } from '@/lib/api';
import { AREAS, PRICE_PERIODS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Form validation error types
interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  categoryId?: string;
}

// Initial form state
const INITIAL_FORM_DATA: AdCreateRequest = {
  title: '',
  description: '',
  price: 0,
  categoryId: 0,
  userId: 1,
};

export function PostAdPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAd, setCreatedAd] = useState<Ad | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState<AdCreateRequest>(INITIAL_FORM_DATA);

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

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const ad = await createAd(formData);

      if (images.length > 0 && ad.editToken) {
        await uploadAdImages(ad.id, ad.editToken, images);
      }

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

  const updateFormField = <K extends keyof AdCreateRequest>(
    field: K,
    value: AdCreateRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ----------- SUCCESS VIEW -----------
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
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="font-semibold text-yellow-800 mb-2">
                Save this link to edit your ad later:
              </p>
              <div className="flex items-center gap-2">
                <Input value={editUrl} readOnly className="flex-grow font-mono text-sm" />
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(editUrl)}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Link to="/"><Button variant="outline">Back</Button></Link>
              <Link to="/post"><Button>Post Another</Button></Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ----------- FORM VIEW -----------
  return (
    <main className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to listings
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Post a New Ad</CardTitle></CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => updateFormField('title', e.target.value)}
                className={formErrors.title ? 'border-red-500' : ''}
                placeholder="Enter title"
              />
              {formErrors.title && <p className="text-red-500 text-sm">{formErrors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${formErrors.description ? 'border-red-500' : ''}`}
                rows={4}
              />
              {formErrors.description && <p className="text-red-500 text-sm">{formErrors.description}</p>}
            </div>

            {/* Images Upload */}
            <div>
              <label className="block text-sm font-medium mb-1">Images</label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files || []))}
              />
              {images.length > 0 && (
                <p className="text-gray-600 text-sm mt-1">
                  Selected: {images.length} file(s)
                </p>
              )}
            </div>

            {/* Price + Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (THB)</label>
                <Input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => updateFormField('price', Number(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price Period</label>
                <Select
                  value={formData.pricePeriod || ''}
                  onValueChange={(v) => updateFormField('pricePeriod', v as PricePeriod)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_PERIODS.map((pp) => (
                      <SelectItem key={pp.value} value={pp.value}>
                        {pp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category + Area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <Select
                  value={String(formData.categoryId || '')}
                  onValueChange={(v) => updateFormField('categoryId', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoryId && <p className="text-red-500 text-sm">{formErrors.categoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Area</label>
                <Select
                  value={formData.area || ''}
                  onValueChange={(v) => updateFormField('area', v as Area)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Post Ad"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
