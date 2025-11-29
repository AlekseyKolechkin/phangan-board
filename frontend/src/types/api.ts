export type AdStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'DELETED';

export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName: string | null;
  userId: number;
  userName: string | null;
  status: AdStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdSearchParams {
  categoryId?: number;
  userId?: number;
  status?: AdStatus;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  page?: number;
  size?: number;
  sortBy?: 'createdAt' | 'price' | 'title' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}
