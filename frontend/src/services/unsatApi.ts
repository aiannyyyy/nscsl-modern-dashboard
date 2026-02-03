import axios from "axios";

/**
 * Base API instance
 * VITE_API_URL=http://localhost:5000/api
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 60000
});

/**
 * ================================
 * TYPES
 * ================================
 */

export interface TopUnsatFacility {
  FACILITY_NAME?: string;
  facility_name?: string;
  PROVINCE?: string;
  province?: string;
  UNSATISFACTORY_COUNT?: number;
  unsatisfactory_count?: number;
}

export interface UnsatDetail {
  LABNO: string;
  FIRST_NAME?: string;
  first_name?: string;
  LAST_NAME?: string;
  last_name?: string;
  TEST_RESULT?: string;
  test_result?: string;
}

export interface FullPatient {
  LABNO: string;
  FIRST_NAME?: string;
  first_name?: string;
  LAST_NAME?: string;
  last_name?: string;
  TEST_RESULT?: string;
  test_result?: string;
  FACILITY_NAME?: string;
  facility_name?: string;
  PROVINCE?: string;
  province?: string;
}

export interface UnsatRate {
  facility_name: string;
  province: string;
  unsatisfactory_count: number;
  total_samples: number;
  unsat_rate: number;
}

export interface UnsatProvince {
  COUNTY: string;
  TOTAL_DISTINCT_UNSAT_PERIOD1: number;
  TOTAL_DISTINCT_UNSAT_PERIOD2: number;
}

/**
 * ================================
 * API METHODS
 * ================================
 */

/**
 * Top unsatisfactory facilities
 */
export const getTopUnsatisfactory = async (
  from: string,
  to: string
): Promise<TopUnsatFacility[]> => {
  const response = await api.get("/unsat/top-unsatisfactory", {
    params: { from, to }
  });
  return response.data;
};

/**
 * Unsatisfactory patient details (BY NUMBERS)
 */
export const getUnsatDetails = async (
  from: string,
  to: string,
  facilityName: string
): Promise<{ total: number; rows: UnsatDetail[] }> => {
  const response = await api.get("/unsat/details-unsatisfactory", {
    params: {
      from,
      to,
      facility_name: facilityName
    }
  });
  return response.data;
};

/**
 * Total samples per facility
 */
export const getTotalSamples = async (
  from: string,
  to: string,
  facilityName: string
): Promise<{ total_samples: number }> => {
  const response = await api.get("/unsat/total-samples", {
    params: {
      from,
      to,
      facility_name: facilityName
    }
  });
  return response.data;
};

/**
 * Unsatisfactory rate (BY PERCENTAGE)
 */
export const getUnsatRate = async (
  from: string,
  to: string
): Promise<UnsatRate[]> => {
  const response = await api.get("/unsat/unsat-rate", {
    params: { from, to }
  });
  return response.data;
};

/**
 * Full patient details (used in modal for percentage view)
 */
export const getFullPatient = async (
  from: string,
  to: string,
  facilityName: string
): Promise<{ total: number; rows: FullPatient[] }> => {
  const response = await api.get("/unsat/full-patient", {
    params: {
      from,
      to,
      facility_name: facilityName
    }
  });
  return response.data;
};

/**
 * Unsatisfactory comparison by province (Period 1 vs Period 2)
 */
export const getUnsatProvince = async (
  dateFrom1: string,
  dateTo1: string,
  dateFrom2: string,
  dateTo2: string
): Promise<{
  success: boolean;
  rows: any[];
  rowCount: number;
}> => {
  const response = await api.get("/unsat/unsat-province", {
    params: { dateFrom1, dateTo1, dateFrom2, dateTo2 }
  });

  return response.data;
};


/**
 * ================================
 * DEFAULT EXPORT
 * ================================
 */

export default {
  getTopUnsatisfactory,
  getUnsatDetails,
  getTotalSamples,
  getUnsatRate,
  getFullPatient,
  getUnsatProvince
};
