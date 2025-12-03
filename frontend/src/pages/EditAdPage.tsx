import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Ad, AdUpdateRequest, Area, PricePeriod, Category, AdStatus } from '@/types/api';
import { getAdByToken, updateAdByToken, deleteAdByToken, getCategories, uploadAdImages, deleteAdImage, ApiError } from '@/lib/api';
import { AREAS, PRICE_PERIODS, USER_EDITABLE_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const FILES_URL = API_URL.replace('/api', '');

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
}

export function EditAdPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ad, setAd] = useState<Ad | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
          status: adData.status,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !ad || !token) return;

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    setError(null);

    try {
      await uploadAdImages(ad.id, token, files);
      // Refresh ad data to get updated images
      const updatedAd = await getAdByToken(token);
      setAd(updatedAd);
      setSuccess('Images uploaded successfully!');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to upload images');
      }
    } finally {
      setUploadingImages(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!ad || !token) return;

    setDeletingImageId(imageId);
    setError(null);

    try {
      await deleteAdImage(ad.id, imageId, token);
      // Update local state
      setAd({
        ...ad,
        images: ad.images?.filter((img) => img.id !== imageId),
      });
      setSuccess('Image deleted successfully!');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete image');
      }
    } finally {
      setDeletingImageId(null);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!ad?.images) return;
    const total = ad.images.length;
    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev - 1 + total) % total);
    } else {
      setLightboxIndex((prev) => (prev + 1) % total);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || !ad?.images) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLightbox('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateLightbox('next');
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, ad?.images]);

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

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => setFormData({ ...formData, status: value as AdStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {USER_EDITABLE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-gray-500 text-xs mt-1">
                Set to Inactive to hide, or Sold when item is no longer available
              </p>
            </div>

            <div className="pt-4 flex gap-4">
              <Button type="submit" disabled={saving} className="flex-grow">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* Images Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Images</h3>

            {/* Current Images */}
            {ad?.images && ad.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {ad.images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${FILES_URL}${image.url}`}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(index)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deletingImageId === image.id}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      title="Delete image"
                    >
                      {deletingImageId === image.id ? (
                        <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No images uploaded yet.</p>
            )}

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="w-full"
              >
                {uploadingImages ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                  </>
                )}
              </Button>
            </div>
          </div>

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

      {/* Image Lightbox */}
      {ad?.images && ad.images.length > 0 && (
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
            {ad.images.length > 1 && (
              <button
                onClick={() => navigateLightbox('prev')}
                className="absolute left-0 top-0 w-1/4 h-full z-40 flex items-center justify-start pl-4 cursor-pointer group"
                aria-label="Previous image"
              >
                <div className="bg-white/10 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="h-8 w-8 text-white" />
                </div>
              </button>
            )}

            {/* Right clickable area */}
            {ad.images.length > 1 && (
              <button
                onClick={() => navigateLightbox('next')}
                className="absolute right-0 top-0 w-1/4 h-full z-40 flex items-center justify-end pr-4 cursor-pointer group"
                aria-label="Next image"
              >
                <div className="bg-white/10 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-8 w-8 text-white" />
                </div>
              </button>
            )}

            {/* Image */}
            <div className="flex items-center justify-center w-full h-full">
              <img
                src={`${FILES_URL}${ad.images[lightboxIndex].url}`}
                alt={`Image ${lightboxIndex + 1}`}
                className="max-w-[90vw] max-h-[90vh] object-contain"
              />
            </div>

            {/* Navigation hint */}
            {ad.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                {lightboxIndex + 1} / {ad.images.length} • Click sides to navigate
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
