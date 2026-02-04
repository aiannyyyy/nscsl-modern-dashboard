// patientApi.ts
import axios from "axios";
import type { PatientDetails } from "./patientDetailsTypes";

// ⚠️ Is this api instance defined here?
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 60000
});

export const getPatientDetailsByLabNo = async (
  labno: string
): Promise<PatientDetails> => {
  const res = await api.get("/patient/details", {
    params: { labno }
  });
  return res.data;
};