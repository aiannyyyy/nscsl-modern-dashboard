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

export interface PISDetailRecord {
  // Patient Identification
  LABNO: string;              // Lab No
  LABID: string;              // Form No
  LNAME: string;              // Last Name
  FNAME: string;              // First Name

  // Birth Info
  BIRTHDT: string;            // Birth Date
  BIRTHTM: string;            // Birth Time

  // Collection Info
  DTCOLL: string;             // Date Collection
  TMCOLL: string;             // Time Collection
  SPECTYPE: string;           // Spec Type
  MILKTYPE: string;           // Milk Type

  // Demographics
  SEX: string;                // Sex
  BIRTHWT: string;            // Birth Weight
  TWIN: string;               // Birth Order
  TRANSFUS: string;           // Blood Transfused
  DTXFUS: string;             // Transfused Date
  GESTAGE: string;            // Gestation Age
  SPECIMEN_AGE_DAYS: number;  // Specimen Age (DTRECV - DTCOLL)
  AGECOLL: string;            // Age at Collection

  // Received / Reported
  DTRECV: string;             // Date Received
  TMRECV: string;             // Time Received
  DTRPTD: string;             // Date Reported

  // Status / Codes
  CLINSTAT: string;           // Clinic Stat
  DEMCODE: string;            // Demog Acceptable
  PHYSID: string;             // Physician ID
  BIRTHHOSP: string;          // Birth Hospital ID
  RELEASEDT: string;          // Demog Release

  // Entry Technicians
  INIT_TECH: number;          // Initial Entry (user ID)
  INIT_TECH_NAME: string;     // Initial Entry (resolved name)
  VER_TECH: number;           // Verification Entry (user ID)
  VER_TECH_NAME: string;      // Verification Entry (resolved name)

  // Facility / Provider
  PROVIDERID: string;         // Facility Code
  DESCR1: string;             // Birth Hospital Name & Facility Name
  STREET1: string;            // Address 1
  STREET2: string;            // Address 2
  CITY: string;               // City
  COUNTY: string;             // Province
  PHONE: string;              // Phone
  FAX: string;                // Fax
  DESCR7: string;             // Mobile
  EMAIL: string;              // Email
  DESCR4: string;             // Coordinator (part 1)
  DESCR5: string;             // Coordinator (part 2)
  DESCR6: string;             // Coordinator (part 3)

  // Disposition / Case
  DISPOSITION: string;        // Disposition
  DISPDATE: string;           // Disposition Date
  USER_ID: number;            // Closed By (user ID)
  CLOSED_BY_NAME: string;     // Closed By (resolved name)
}

export interface PISResponse {
  success: boolean;
  data: PISRecord[];
  count: number;
  filters: PISSearchParams;
  executionTime: string;
  timestamp: string;
}

export interface PISDetailResponse {
  success: boolean;
  data: Record<string, PISDetailRecord[]>; // grouped by LABNO
  count: number;
  labno: string;
  executionTime: string;
  timestamp: string;
}

// ==================== SERVICE ====================

/**
 * Maps frontend SearchParams field names to backend query param names
 */
const mapParamsToQuery = (params: Record<string, string>): PISSearchParams => {
  const mapped: PISSearchParams = {};

  if (params.labNumber)            mapped.labno      = params.labNumber;
  if (params.lastName)             mapped.lname      = params.lastName;
  if (params.firstName)            mapped.fname      = params.firstName;
  if (params.collectionHospitalId) mapped.submid     = params.collectionHospitalId;
  if (params.physicianId)          mapped.phyid      = params.physicianId;
  if (params.sex)                  mapped.sex        = params.sex;
  if (params.outsideLab)           mapped.outsideLab = params.outsideLab;
  if (params.formNumber)           mapped.formno     = params.formNumber;
  if (params.birthDate)            mapped.birthdt    = params.birthDate;
  if (params.dateCollection)       mapped.dtcoll     = params.dateCollection;
  if (params.dateReceived)         mapped.dtrecv     = params.dateReceived;
  if (params.dateReported)         mapped.dtrptd     = params.dateReported;

  return mapped;
};

/**
 * Search patients — all params optional, at least one required
 * GET /api/laboratory/pis/search
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

/**
 * Get full patient detail by Lab No
 * GET /api/laboratory/pis/detail?labno=:labno
 * Response data is grouped by LABNO
 */
export const getPatientDetail = async (
  labno: string
): Promise<PISDetailResponse> => {
  try {
    const response = await api.get('/laboratory/pis/detail', {
      params: { labno: labno.trim() },
    });
    return response.data;
  } catch (error) {
    console.error('[pisService] getPatientDetail error:', error);
    throw error;
  }
};

// ==================== RESULTS TYPES ====================

export interface PISResultRecord {
  ABBREV:              string;   // Test name / abbreviation (TEST column)
  VALUE:               string;   // Result value
  TESTCODE:            string;   // Test code (CODE column)
  EXPECTED:            string;   // Reference range
  MNEMONIC:            string;   // Mnemonic
  INSTRUCT:            string;   // Instruction
  DISORDERRESULTTEXT:  string;   // Result text
}

export interface PISResultsResponse {
  success:       boolean;
  data:          PISResultRecord[];
  count:         number;
  labno:         string;
  executionTime: string;
  timestamp:     string;
}

// ==================== RESULTS SERVICE ====================

/**
 * Get lab test results for a single Lab No
 * GET /api/laboratory/pis/results?labno=:labno
 * Populates the Results/Mailers table in the Patient Record Modal
 */
export const getPatientResults = async (
  labno: string
): Promise<PISResultsResponse> => {
  try {
    const response = await api.get('/laboratory/pis/results', {
      params: { labno: labno.trim() },
    });
    return response.data;
  } catch (error) {
    console.error('[pisService] getPatientResults error:', error);
    throw error;
  }
};

// ==================== TEST SEQUENCE TYPES ====================

export interface PISTestSeqRecord {
  LABNO:    string;
  TESTSEQ:  string | number;  // SEQ column
  MNEMONIC: string;           // MNC column
  VALUE:    string;           // Value
  RFLAG:    string;           // Reference flag (blank = normal, * = abnormal)
  ABBREV:   string;           // Test abbreviation
}

export interface PISTestSeqResponse {
  success:       boolean;
  data:          PISTestSeqRecord[];
  count:         number;
  labno:         string;
  executionTime: string;
  timestamp:     string;
}

// ==================== TEST SEQUENCE SERVICE ====================

/**
 * Get test sequence / analytes for a given LABNO
 * GET /api/laboratory/pis/testsequence?labno=:labno
 * Populates the Test Sequence / Analytes panel when a result row is clicked
 */
export const getTestSequence = async (
  labno: string
): Promise<PISTestSeqResponse> => {
  try {
    const response = await api.get('/laboratory/pis/testsequence', {
      params: { labno: labno.trim() },
    });
    return response.data;
  } catch (error) {
    console.error('[pisService] getTestSequence error:', error);
    throw error;
  }
};

// ==================== PATIENT FILTER CARDS TYPES ====================

export interface PISFilterCardRecord {
  LABNO:  string;
  LNAME:  string;
  FNAME:  string;
  DTRPTD: string; // null = UNMAILED, has date = MAILED
}

export interface PISFilterCardsResponse {
  success:       boolean;
  data:          PISFilterCardRecord[];
  count:         number;
  fname:         string;
  lname:         string;
  executionTime: string;
  timestamp:     string;
}

// ==================== PATIENT FILTER CARDS SERVICE ====================

/**
 * Get all LABNOs for a patient by FNAME + LNAME
 * GET /api/laboratory/pis/filtercards?fname=:fname&lname=:lname
 * Populates the Patient Filter Cards panel in the modal
 */
export const getPatientFilterCards = async (
  fname: string,
  lname: string
): Promise<PISFilterCardsResponse> => {
  try {
    const response = await api.get('/laboratory/pis/filtercards', {
      params: { fname: fname.trim(), lname: lname.trim() },
    });
    return response.data;
  } catch (error) {
    console.error('[pisService] getPatientFilterCards error:', error);
    throw error;
  }
};