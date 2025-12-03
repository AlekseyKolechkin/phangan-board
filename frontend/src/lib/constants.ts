import { Area, PricePeriod, AdStatus } from '@/types/api';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const AREAS: SelectOption<Area>[] = [
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

export const PRICE_PERIODS: SelectOption<PricePeriod>[] = [
  { value: 'DAY', label: 'Per Day' },
  { value: 'WEEK', label: 'Per Week' },
  { value: 'MONTH', label: 'Per Month' },
  { value: 'SALE', label: 'For Sale' },
];

// Statuses that users can change to (excludes DELETED and BLOCKED)
export const USER_EDITABLE_STATUSES: SelectOption<AdStatus>[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SOLD', label: 'Sold' },
];

