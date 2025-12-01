import { Ad, Category, PageResponse, AdSearchParams, AdCreateRequest, AdUpdateRequest } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
  status: number;
  statusText: string;
  
  constructor(status: number, statusText: string, message?: string) {
    super(message || `API Error: ${status} ${statusText}`);
    this.status = status;
    this.statusText = statusText;
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(response.status, response.statusText, errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
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
  if (params.area !== undefined) searchParams.set('area', params.area);
  if (params.pricePeriod !== undefined) searchParams.set('pricePeriod', params.pricePeriod);
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

export async function createAd(data: AdCreateRequest): Promise<Ad> {
  return fetchApi<Ad>('/ads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAdByToken(token: string): Promise<Ad> {
  return fetchApi<Ad>(`/ads/edit/${token}`);
}

export async function updateAdByToken(token: string, data: AdUpdateRequest): Promise<Ad> {
  return fetchApi<Ad>(`/ads/edit/${token}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdByToken(token: string): Promise<void> {
  return fetchApi<void>(`/ads/edit/${token}`, {
    method: 'DELETE',
  });
}
