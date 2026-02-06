import api from '../api';

export interface LabReagents {
  itemCode: string;
  description: string;
  stock: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface LabReagentsResponse {
  success: boolean;
  count: number;
  data: LabReagents[];
  timestamp: string;
}

// Changed function name from getLabSupplies to getLabReagents
export const getLabReagents = async (): Promise<LabReagentsResponse> => {
  const { data } = await api.get('/laboratory/lab-reagents');
  return data;
};