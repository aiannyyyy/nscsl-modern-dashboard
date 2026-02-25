import api from '../api';

// ==================== TYPES ====================

export interface PISSearchParams {
  labno?: string;
  labid?: string;
  lname?: string;
  fname?: string;
  submid?: string;
  birthdt?: string;
  dtcoll?: string;
  dtrecv?: string;
  dtrptd?: string;
  sex?: string;
  phyid?: string;
  outsideLab?: string;
  formno?: string;
}

export interface PISRecord {
  LABNO: string;
  LABID: string;
  FNAME: string;
  LNAME: string;
  SUBMID: string;
  BIRTHDT: string;
  BIRTHTM: string;
  DTCOLL: string;
  TMCOLL: string;
  DTRECV: string;
  TMRECV: string;
  DTRPTD: string;
  GESTAGE: string;
  AGECOLL: string;
  SEX: string;
}

export interface PISResponse {
  success: boolean;
  data: PISRecord[];
  count: number;
  filters: PISSearchParams;
  executionTime: string;
  timestamp: string;
}

// ==================== SERVICE ====================

/**
 * Maps frontend SearchParams field names to backend query param names
 */
const mapParamsToQuery = (params: Record<string, string>): PISSearchParams => {
  const mapped: PISSearchParams = {};

  if (params.labNumber)           mapped.labno      = params.labNumber;
  if (params.lastName)            mapped.lname      = params.lastName;
  if (params.firstName)           mapped.fname      = params.firstName;
  if (params.collectionHospitalId) mapped.submid    = params.collectionHospitalId;
  if (params.physicianId)         mapped.phyid      = params.physicianId;
  if (params.sex)                 mapped.sex        = params.sex;
  if (params.outsideLab)          mapped.outsideLab = params.outsideLab;
  if (params.formNumber)          mapped.formno     = params.formNumber;
  if (params.birthDate)           mapped.birthdt    = params.birthDate;
  if (params.dateCollection)      mapped.dtcoll     = params.dateCollection;
  if (params.dateReceived)        mapped.dtrecv     = params.dateReceived;
  if (params.dateReported)        mapped.dtrptd     = params.dateReported;

  return mapped;
};

/**
 * Search patients — all params optional, at least one required
 */
export const searchPatients = async (
  params: Record<string, string>
): Promise<PISResponse> => {
  try {
    const queryParams = mapParamsToQuery(params);

    // Strip empty strings so backend doesn't receive blank params
    const cleanParams = Object.fromEntries(
      Object.entries(queryParams).filter(([, v]) => v && v.trim() !== '')
    );

    const response = await api.get('/laboratory/pis/search', {
      params: cleanParams,
    });

    return response.data;
  } catch (error) {
    console.error('[pisService] searchPatients error:', error);
    throw error;
  }
};