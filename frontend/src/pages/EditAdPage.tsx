import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Ad, AdUpdateRequest, Area, PricePeriod, Category } from '@/types/api';
import { getAdByToken, updateAdByToken, deleteAdByToken, getCategories, ApiError } from '@/lib/api';
import { AREAS, PRICE_PERIODS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
}

export function EditAdPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<AdUpdateRequest>({});

  useEffect(() => {
    if (!token) {
      setError('Invalid edit link');
      setLoading(false);
      return;
    }

    Promise.all([
      getAdByToken(token),
      getCategories(),
    ])
      .then(([adData, categoriesData]) => {
        setAd(adData);
        setCategories(categoriesData);
        setFormData({
          title: adData.title,
          description: adData.description,
          price: adData.price,
          categoryId: adData.categoryId,
          area: adData.area || undefined,
          pricePeriod: adData.pricePeriod || undefined,
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Ad not found. The link may be invalid or the ad has been deleted.');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (formData.title !== undefined && formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (formData.description !== undefined && formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (formData.price !== undefined && formData.price < 0) {
      errors.price = 'Price cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedAd = await updateAdByToken(token, formData);
      setAd(updatedAd);
      setSuccess('Ad updated successfully!');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update ad');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteAdByToken(token);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete ad');
      }
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-6 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Loading ad...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error && !ad) {
    return (
      <main className="max-w-2xl mx-auto py-6 px-4">
        <Card>
          <CardContent className="py-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
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
          <CardTitle>Edit Ad</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ad title"
                className={formErrors.title ? 'border-red-500' : ''}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description || ''}
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
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select
                  value={formData.categoryId ? String(formData.categoryId) : ''}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: Number(value) })}
                >
                  <SelectTrigger>
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
            
            <div className="pt-4 flex gap-4">
              <Button type="submit" disabled={saving} className="flex-grow">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Ad
              </Button>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-red-700 mb-4">
                  Are you sure you want to delete this ad? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
