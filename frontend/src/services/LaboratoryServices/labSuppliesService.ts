import api from '../api';

export interface LabSupply {
  itemCode: string;
  description: string;
  stock: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface LabSuppliesResponse {
  success: boolean;
  count: number;
  data: LabSupply[];
  timestamp: string;
}

export const getLabSupplies = async (): Promise<LabSuppliesResponse> => {
  const { data } = await api.get('/laboratory/lab-supplies');
  return data;
};
