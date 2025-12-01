export type AdStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'DELETED' | 'BLOCKED';

export type Area = 
  | 'THONG_SALA'
  | 'SRITHANU'
  | 'HAAD_RIN'
  | 'BAAN_TAI'
  | 'BAAN_KAI'
  | 'CHALOKLUM'
  | 'MAE_HAAD'
  | 'SALAD'
  | 'HIN_KONG'
  | 'WOK_TUM'
  | 'OTHER';

export type PricePeriod = 'DAY' | 'WEEK' | 'MONTH' | 'SALE';

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
  area: Area | null;
  pricePeriod: PricePeriod | null;
  editToken?: string;
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
  area?: Area;
  pricePeriod?: PricePeriod;
  page?: number;
  size?: number;
  sortBy?: 'createdAt' | 'price' | 'title' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

export interface AdCreateRequest {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  userId: number;
  area?: Area;
  pricePeriod?: PricePeriod;
}

export interface AdUpdateRequest {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  area?: Area;
  pricePeriod?: PricePeriod;
}
