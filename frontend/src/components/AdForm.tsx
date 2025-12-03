import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ad, Category } from '@/types/api';
import { getCategories, createAd } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

interface AdFormProps {
  ad?: Ad;
  onSave: (ad: Ad) => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  userId: string;
}

export function AdForm({ ad, onSave, onCancel }: AdFormProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: ad?.title || '',
    description: ad?.description || '',
    price: ad?.price?.toString() || '',
    categoryId: ad?.categoryId?.toString() || '',
    userId: ad?.userId?.toString() || '1',
  });

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        userId: parseInt(formData.userId),
        status: ad?.status || 'ACTIVE',
      };

      // Note: This component only supports creating new ads
      // For editing, use EditAdPage which uses token-based authentication
      const savedAd = await createAd(payload);
      onSave(savedAd);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('adForm.saveError');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.title && formData.description && formData.price && formData.categoryId;

  return (
    <div className="max-w-2xl mx-auto">
      <Button onClick={onCancel} variant="ghost" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {ad ? t('adForm.editTitle') : t('adForm.createTitle')}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{t('adForm.title')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('adForm.titlePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('adForm.description')} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('adForm.descriptionPlaceholder')}
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('adForm.price')} *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('adForm.category')} *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleChange('categoryId', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t('adForm.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4 flex gap-2">
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? t('common.saving') : t('common.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
