import api from '../api';

export interface BreakdownItem {
  submid: string;
  descr1: string;
  total_count: number;
}

export interface FilterCardResult {
  city: string;
  total_count: number;
  breakdown: BreakdownItem[];
}

export interface FilterCardResponse {
  success: boolean;
  data: FilterCardResult[];
}

export interface FilterCardParams {
  date_from: string; // "YYYY-MM-DD"
  date_to: string;   // "YYYY-MM-DD"
}

export const getLopezPurchasedFilterCards = async (
  params: FilterCardParams
): Promise<FilterCardResponse> => {
  try {
    const response = await api.get<FilterCardResponse>(
      '/pdo/lopez-purchased-filter-cards',
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching Lopez purchased filter cards:', error);
    throw error;
  }
};