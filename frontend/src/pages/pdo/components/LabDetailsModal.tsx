import React, { useState, useEffect, useMemo } from 'react';
import type { LabDetailsData } from '../../../services/nsfPerformanceApi';
import { NotebookDetailsModal } from './NotebookDetailsModal';
import type { PatientDetails } from '../../../services/patientDetailsTypes';

interface LabDetailsModalProps {
  show: boolean;
  onHide: () => void;
  labDetails: LabDetailsData[];
  isLoading: boolean;
  error: string | null;
  facilityName: string;
  dateRange: string;
  category: string;
}

const LabDetailsModal: React.FC<LabDetailsModalProps> = ({
  show,
  onHide,
  labDetails,
  isLoading,
  error,
  facilityName,
  dateRange,
  category,
}) => {
  const [filterLabno, setFilterLabno] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterSpectype, setFilterSpectype] = useState('');

  // Notebook modal state
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  
  // ✅ Add loading and error states for fetching patient details
  const [fetchingPatientDetails, setFetchingPatientDetails] = useState(false);
  const [patientDetailsError, setPatientDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setFilterLabno('');
      setFilterName('');
      setFilterSpectype('');
    }
  }, [show]);

  const filteredData = useMemo(() => {
    return labDetails.filter((item) => {
      const matchLabno =
        !filterLabno || item.LABNO.toLowerCase().includes(filterLabno.toLowerCase());
      const matchName =
        !filterName ||
        `${item.FNAME} ${item.LNAME}`.toLowerCase().includes(filterName.toLowerCase());
      const matchSpectype = !filterSpectype || item.SPECTYPE_LABEL === filterSpectype;

      return matchLabno && matchName && matchSpectype;
    });
  }, [labDetails, filterLabno, filterName, filterSpectype]);

  const handleExportCSV = () => {
    if (!filteredData.length) return;

    const headers = ['Lab No', 'First Name', 'Last Name', 'Type', 'Birth Location', 'Status'];
    const csv = [
      headers.join(','),
      ...filteredData.map((item) =>
        [
          item.LABNO,
          item.FNAME,
          item.LNAME,
          item.SPECTYPE_LABEL,
          item.BIRTH_CATEGORY,
          item.ISSUE_DESCRIPTION || 'NORMAL',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lab_details_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Updated handler using the WORKING endpoint from FacilityPatientModal
  const handleViewNotebook = async (item: LabDetailsData) => {
    try {
      setFetchingPatientDetails(true);
      setPatientDetailsError(null);
      setSelectedPatient(null);
      setShowNotebookModal(true);

      console.log('🔍 Fetching patient details for LABNO:', item.LABNO);

      // ✅ Use the same endpoint as FacilityPatientModal
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const completeDetailsUrl = `${API_BASE_URL}/notebooks/complete-details?labno=${item.LABNO}`;

      console.log('📡 Fetching from:', completeDetailsUrl);

      const response = await fetch(completeDetailsUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch patient details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Patient data received:', data);

      // ✅ Transform the response to PatientDetails format (same as FacilityPatientModal)
      const patientDetails: PatientDetails = {
        labno: data.LABNO || item.LABNO,
        labid: data.LABID || '',
        fname: data.FNAME || item.FNAME,
        lname: data.LNAME || item.LNAME,
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
        submid: data.SUBMID || item.SUBMID.toString(),
        provider_descr1: data.PROVIDER_DESCR1,
        notes: data.NOTES,
        disorderResults: Array.isArray(data.disorderResults) ? data.disorderResults : []
      };

      setSelectedPatient(patientDetails);
      
    } catch (error) {
      console.error('❌ Error fetching patient details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPatientDetailsError(`Failed to load patient details: ${errorMessage}`);
      
      // Show user-friendly error message
      alert(`Failed to load patient details for Lab No: ${item.LABNO}\n\nError: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
      
      // Close the modal on error
      setShowNotebookModal(false);
    } finally {
      setFetchingPatientDetails(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {category} - Lab Details
            </h2>
            <button
              onClick={onHide}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {isLoading && (
              <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400 py-12">
                <div className="h-8 w-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                <span className="text-lg">Loading lab details...</span>
              </div>
            )}

            {error && !isLoading && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* ✅ Show error message if patient details fetch fails */}
            {patientDetailsError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{patientDetailsError}</span>
                </div>
              </div>
            )}

            {!isLoading && !error && labDetails.length > 0 && (
              <>
                {/* Summary Grid */}
                <div className="grid grid-cols-4 gap-6 mb-6 text-sm">
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Facility:</div>
                    <div className="text-gray-900 dark:text-gray-100">{facilityName}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Date Range:</div>
                    <div className="text-gray-900 dark:text-gray-100">{dateRange}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Category:</div>
                    <div className="text-gray-900 dark:text-gray-100">{category}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Total Records:</div>
                    <div className="text-gray-900 dark:text-gray-100 font-bold">{filteredData.length}</div>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">Lab #</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={filterLabno}
                      onChange={(e) => setFilterLabno(e.target.value)}
                      placeholder="Search by lab number..."
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">Name</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Search by name..."
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">Type</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={filterSpectype}
                      onChange={(e) => setFilterSpectype(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Initial">Initial</option>
                      <option value="Repeat">Repeat</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Unfit">Unfit</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 dark:bg-gray-950 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Lab No</th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Type</th>
                        <th className="px-4 py-3 text-left font-semibold">Birth</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Take Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <span>No records found.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((item, index) => (
                          <tr 
                            key={item.LABNO} 
                            className={`${
                              index % 2 === 0 
                                ? 'bg-white dark:bg-gray-800' 
                                : 'bg-gray-50 dark:bg-gray-800/50'
                            } hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                              {item.LABNO}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                              {item.FNAME} {item.LNAME}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                                item.SPECTYPE_LABEL === 'Unfit' 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : item.SPECTYPE_LABEL === 'Repeat'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                {item.SPECTYPE_LABEL}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-cyan-400 dark:bg-cyan-600 text-white">
                                {item.BIRTH_CATEGORY}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-md text-xs font-semibold ${
                                  item.ISSUE_DESCRIPTION && item.ISSUE_DESCRIPTION !== 'NORMAL'
                                    ? 'bg-red-400 dark:bg-red-600 text-white'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                }`}
                              >
                                {item.ISSUE_DESCRIPTION || 'NORMAL'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => handleViewNotebook(item)}
                                disabled={fetchingPatientDetails}
                                className="px-4 py-1.5 bg-blue-600 dark:bg-blue-700 text-white rounded-md text-xs font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {fetchingPatientDetails ? (
                                  <>
                                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  'View Notebook'
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {!isLoading && !error &&
                `Showing ${filteredData.length} of ${labDetails.length} total records`}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                disabled={!filteredData.length}
                className="px-5 py-2 rounded-lg bg-teal-500 dark:bg-teal-600 text-white font-medium text-sm hover:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                CSV
              </button>
              <button
                onClick={onHide}
                className="px-5 py-2 rounded-lg bg-cyan-400 dark:bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notebook Details Modal */}
      <NotebookDetailsModal
        isOpen={showNotebookModal}
        onClose={() => {
          setShowNotebookModal(false);
          setSelectedPatient(null);
        }}
        onBackToResults={() => setShowNotebookModal(false)}
        onBackToSearch={() => {
          setShowNotebookModal(false);
          onHide();
        }}
        patient={selectedPatient}
        loading={fetchingPatientDetails}
        onNotebookAdded={() => {
          console.log('Notebook added from lab details modal');
        }}
      />
    </>
  );
};

export default LabDetailsModal;