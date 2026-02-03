import React, { useEffect, useState } from "react";
import { getUnsatDetails, getFullPatient } from "../../../services/unsatApi";
import type { PatientDetails } from "../../../services/patientDetailsTypes";
import { NotebookDetailsModal } from "./NotebookDetailsModal";

type Mode = "numbers" | "percentage";

interface Props {
  open: boolean;
  onClose: () => void;
  facilityName: string | null;
  from: string;
  to: string;
  mode: Mode;
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

export const FacilityPatientModal: React.FC<Props> = ({
  open,
  onClose,
  facilityName,
  from,
  to,
  mode,
}) => {
  const [data, setData] = useState<UnsatDetail[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Notebook modal state
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);

  // ================= FETCH FACILITY DETAILS =================
  useEffect(() => {
    if (!open || !facilityName) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);

        if (mode === "numbers") {
          const res = await getUnsatDetails(from, to, facilityName);
          setData(res.rows || res);
        }

        if (mode === "percentage") {
          const res = await getFullPatient(from, to, facilityName);
          setData(res.rows || []);
        }
      } catch (err) {
        console.error("❌ Failed to load facility details", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [open, facilityName, from, to, mode]);

  // ================= OPEN NOTEBOOK =================
  const openNotebook = async (row: UnsatDetail) => {
    try {
      setPatientLoading(true);
      setSelectedPatient(null);
      setShowNotebookModal(true);

      console.log("🔍 Fetching patient details for LABNO:", row.LABNO);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const completeDetailsUrl = `${API_BASE_URL}/notebooks/complete-details?labno=${row.LABNO}`;

      console.log('📡 Fetching from:', completeDetailsUrl);

      const response = await fetch(completeDetailsUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Patient data received:', data);

      const patientDetails: PatientDetails = {
        labno: data.LABNO || row.LABNO,
        labid: data.LABID || '',
        fname: data.FNAME || row.FIRST_NAME || row.first_name || '',
        lname: data.LNAME || row.LAST_NAME || row.last_name || '',
        sex: data.SEX || '',
        birthdt: data.BIRTHDT,
        birthtm: data.BIRTHTM,
        birthwt: data.BIRTHWT || '',
        birthhosp: data.BIRTHHOSP,
        dtcoll: data.DTCOLL,
        tmcoll: data.TMCOLL,
        dtrecv: data.DTRECV,
        dtrptd: data.DTRPTD,
        releasedt: data.RELEASEDT,
        spectype: data.SPECTYPE,
        milktype: data.MILKTYPE,
        gestage: data.GESTAGE,
        agecoll: data.AGECOLL,
        transfus: data.TRANSFUS,
        transfusdt: data.TRANSFUSDT,
        birthorder: data.BIRTHORDER,
        clinstat: data.CLINSTAT,
        physid: data.PHYSID,
        submid: data.SUBMID || '',
        provider_descr1: data.PROVIDER_DESCR1,
        notes: data.NOTES,
        disorderResults: Array.isArray(data.disorderResults) ? data.disorderResults : []
      };

      setSelectedPatient(patientDetails);

    } catch (error) {
      console.error("❌ Failed to load patient details", error);
      alert(`Failed to load patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowNotebookModal(false);
    } finally {
      setPatientLoading(false);
    }
  };

  const handleBackToFacilityList = () => {
    setShowNotebookModal(false);
    setSelectedPatient(null);
  };

  const handleCompleteClose = () => {
    setShowNotebookModal(false);
    setSelectedPatient(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* ================= FACILITY PATIENT MODAL ================= */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-6xl rounded-xl bg-white dark:bg-gray-900 shadow-lg">
          {/* HEADER */}
          <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">
              Facility Details — {facilityName}
            </h5>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading details...</p>
              </div>
            )}

            {!loading && data.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">No unsatisfactory samples found</p>
              </div>
            )}

            {!loading && data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-300 dark:border-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-left text-gray-700 dark:text-gray-300 font-semibold">
                        Lab No
                      </th>
                      <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-left text-gray-700 dark:text-gray-300 font-semibold">
                        Patient Name
                      </th>
                      <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-left text-gray-700 dark:text-gray-300 font-semibold">
                        Test Result
                      </th>
                      <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => {
                      const firstName = row.FIRST_NAME || row.first_name || "";
                      const lastName = row.LAST_NAME || row.last_name || "";
                      const testResult = row.TEST_RESULT || row.test_result || "—";

                      return (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                            {row.LABNO}
                          </td>

                          <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                            {firstName} {lastName}
                          </td>

                          <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-red-600 dark:text-red-400 font-semibold">
                            {testResult}
                          </td>

                          <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-center">
                            <button
                              className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              onClick={() => openNotebook(row)}
                            >
                              View Notebook
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end px-5 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ================= NOTEBOOK DETAILS MODAL ================= */}
      <NotebookDetailsModal
        isOpen={showNotebookModal}
        onClose={handleCompleteClose}
        onBackToResults={handleBackToFacilityList}
        onBackToSearch={handleCompleteClose}
        patient={selectedPatient}
        loading={patientLoading}
        onNotebookAdded={() => {
          console.log("🔄 Notebook added from Unsatisfactory view");
        }}
      />
    </>
  );
};