import { Ad, Category, PageResponse, AdSearchParams } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function searchAds(params: AdSearchParams = {}): Promise<PageResponse<Ad>> {
  const searchParams = new URLSearchParams();
  
  if (params.categoryId !== undefined) searchParams.set('categoryId', String(params.categoryId));
  if (params.userId !== undefined) searchParams.set('userId', String(params.userId));
  if (params.status !== undefined) searchParams.set('status', params.status);
  if (params.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice));
  if (params.q !== undefined && params.q.trim()) searchParams.set('q', params.q);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.sortBy !== undefined) searchParams.set('sortBy', params.sortBy);
  if (params.sortDirection !== undefined) searchParams.set('sortDirection', params.sortDirection);

  const queryString = searchParams.toString();
  const endpoint = `/ads/search${queryString ? `?${queryString}` : ''}`;
  
  return fetchApi<PageResponse<Ad>>(endpoint);
}

export async function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>('/categories');
}

export async function getAdById(id: number): Promise<Ad> {
  return fetchApi<Ad>(`/ads/${id}`);
}

export interface AdCreatePayload {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  userId: number;
  status?: string;
}

export interface AdUpdatePayload {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  status?: string;
}

export async function createAd(payload: AdCreatePayload): Promise<Ad> {
  return fetchApi<Ad>('/ads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAd(id: number, payload: AdUpdatePayload): Promise<Ad> {
  return fetchApi<Ad>(`/ads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAd(id: number): Promise<void> {
  await fetchApi<void>(`/ads/${id}`, {
    method: 'DELETE',
  });
}
