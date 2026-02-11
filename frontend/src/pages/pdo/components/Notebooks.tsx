import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { NotebookSearchModal } from './NotebookSearchModal';
import { NotebookResultsModal } from './NotebookResultsModal';
import { NotebookDetailsModal } from './NotebookDetailsModal';
import type { SearchCriteria } from './NotebookSearchModal';
import * as notebooksApi from '../../../services/PDOServices/notebooksApi';
import type { PatientSearchResult } from '../../../services/PDOServices/notebooksApi';
import { usePermissions } from '../../../hooks/usePermission';


interface PatientResult {
    labno: string;
    labid: string;
    fname: string;
    lname: string;
    sex: string;
    dob: string;
    birthwt: string;
    submid: string;
    descr1?: string;
    notes?: string;
}

interface DisorderResult {
    LABNO: string;
    DISORDER_NAME: string;
    MNEMONIC: string;
    DESCR1: string;
    DISORDERRESULTTEXT: string;
    GROUP_NAME: string;
}

interface PatientDetails {
    labno: string;
    labid: string;
    fname: string;
    lname: string;
    birthdt?: string;
    birthtm?: string;
    dtcoll?: string;
    tmcoll?: string;
    spectype?: string;
    milktype?: string;
    sex: string;
    birthwt: string;
    birthorder?: string;
    transfus?: string;
    transfusdt?: string;
    gestage?: string;
    agecoll?: string;
    dtrecv?: string;
    dtrptd?: string;
    releasedt?: string;
    clinstat?: string;
    physid?: string;
    birthhosp?: string;
    birthhospname?: string;
    submid: string;
    provider_descr1?: string;
    notes?: string;
    disorderResults?: DisorderResult[];
    [key: string]: any;
}

export const Notebooks: React.FC = () => {
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // ✅ Store recent notebook entries for display in the main table
    const [recentNotebookEntries, setRecentNotebookEntries] = useState<any[]>([]);
    const [notebooksLoading, setNotebooksLoading] = useState(false);
    
    // ✅ Add refresh counter to force re-fetch
    const [refreshCounter, setRefreshCounter] = useState(0);

    const { canCreate } = usePermissions(['program', 'administrator']);

    // ✅ Function to fetch recent notebook entries
    const fetchRecentNotebooks = useCallback(async () => {
        console.log('🔄 Fetching recent notebooks... (Attempt:', refreshCounter + 1, ')');
        setNotebooksLoading(true);
        setError(null);
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const url = `${API_BASE_URL}/notebooks/recent`;
            
            console.log('📡 Fetching from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    // Add cache-busting header to prevent browser caching
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                // Add cache mode to force fresh fetch
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Recent notebooks received:', data);
            console.log('📊 Number of entries:', data.data?.length || 0);
            
            setRecentNotebookEntries(data.data || []);
            
            if (data.data && data.data.length > 0) {
                console.log('📝 First entry:', data.data[0]);
            }
            
        } catch (err) {
            console.error('❌ Error fetching recent notebooks:', err);
            setError(err instanceof Error ? err.message : 'Failed to load recent notebooks');
        } finally {
            setNotebooksLoading(false);
        }
    }, [refreshCounter]); // Depend on refreshCounter to trigger re-fetch

    // ✅ Fetch on mount and when refreshCounter changes
    useEffect(() => {
        console.log('🎯 useEffect triggered - refreshCounter:', refreshCounter);
        fetchRecentNotebooks();
    }, [refreshCounter, fetchRecentNotebooks]);

    // Convert backend response to frontend format
    const mapPatientResult = (patient: PatientSearchResult): PatientResult => ({
        labno: patient.LABNO || '',
        labid: patient.LABID || '',
        fname: patient.FNAME || '',
        lname: patient.LNAME || '',
        sex: patient.SEX || '',
        dob: patient.BIRTHDT || '',
        birthwt: patient.BIRTHWT || '',
        submid: patient.SUBMID || '',
        descr1: patient.DESCR1,
        notes: patient.NOTES,
    });

    const handleSearch = async (criteria: SearchCriteria) => {
        console.log('🔍 Search criteria:', criteria);
        setLoading(true);
        setError(null);
        setShowSearchModal(false);
        setShowResultsModal(true);

        try {
            const results = await notebooksApi.searchPatients(criteria);
            const mappedResults = results.map(mapPatientResult);
            setSearchResults(mappedResults);
            console.log(`✅ Found ${mappedResults.length} results`);
        } catch (err) {
            console.error('❌ Search error:', err);
            setError(err instanceof Error ? err.message : 'Failed to search patients');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (patient: PatientResult) => {
        console.log('👁️ Viewing details for patient:', patient.labno, patient.labid);
        setDetailsLoading(true);
        setShowResultsModal(false);
        setShowDetailsModal(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            const completeDetailsUrl = patient.labid 
                ? `${API_BASE_URL}/notebooks/complete-details?labno=${patient.labno}&labid=${patient.labid}`
                : `${API_BASE_URL}/notebooks/complete-details?labno=${patient.labno}`;
            
            console.log('📡 Fetching complete patient details from:', completeDetailsUrl);
            
            const response = await fetch(completeDetailsUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch patient details: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Complete data received:', data);
            
            const patientDetails: PatientDetails = {
                labno: data.LABNO || patient.labno,
                labid: data.LABID || patient.labid,
                fname: data.FNAME || patient.fname,
                lname: data.LNAME || patient.lname,
                sex: data.SEX || patient.sex,
                birthdt: data.BIRTHDT,
                birthtm: data.BIRTHTM,
                birthwt: data.BIRTHWT || patient.birthwt,
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
                clinstat: data.CLINSTAT,
                physid: data.PHYSID,
                submid: data.SUBMID || patient.submid,
                provider_descr1: data.PROVIDER_DESCR1,
                notes: data.NOTES,
                disorderResults: Array.isArray(data.disorderResults) ? data.disorderResults : []
            };
            
            setSelectedPatient(patientDetails);
            
        } catch (err) {
            console.error('❌ Error fetching patient details:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch patient details');
            
            setSelectedPatient({
                labno: patient.labno,
                labid: patient.labid,
                fname: patient.fname,
                lname: patient.lname,
                sex: patient.sex,
                birthwt: patient.birthwt,
                submid: patient.submid,
                birthdt: patient.dob,
                disorderResults: [],
            });
        } finally {
            setDetailsLoading(false);
        }
    };

    // ✅ Callback when notebook is added successfully - increment counter to trigger refresh
    const handleNotebookAdded = useCallback(() => {
        console.log('🎉 Notebook added successfully! Triggering refresh...');
        setRefreshCounter(prev => {
            const newValue = prev + 1;
            console.log('📈 Refresh counter updated:', prev, '→', newValue);
            return newValue;
        });
    }, []);

    // ✅ Manual refresh button handler
    const handleManualRefresh = () => {
        console.log('🔄 Manual refresh triggered');
        setRefreshCounter(prev => prev + 1);
    };

    const handleBackToSearch = () => {
        setShowResultsModal(false);
        setShowDetailsModal(false);
        setShowSearchModal(true);
        setSearchResults([]);
        setSelectedPatient(null);
        setError(null);
    };

    const handleBackToResults = () => {
        setShowDetailsModal(false);
        setShowResultsModal(true);
        setError(null);
    };

    const handleCloseAll = () => {
        setShowSearchModal(false);
        setShowResultsModal(false);
        setShowDetailsModal(false);
        setSearchResults([]);
        setSelectedPatient(null);
        setError(null);
    };

    // ✅ Format date for display (Philippine timezone)
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', { 
                timeZone: 'Asia/Manila',
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            console.error('Error formatting date:', err);
            return dateString;
        }
    };

    // ✅ Check if in development mode using import.meta.env
    const isDevelopment = import.meta.env.MODE === 'development';

    return (
        <>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors min-h-[500px] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            Recent Notebooks
                            {/* ✅ Show refresh counter in dev mode */}
                            {isDevelopment && (
                                <span className="text-xs text-gray-500">
                                    (Refresh: {refreshCounter})
                                </span>
                            )}
                        </h4>
                        <div className="flex gap-2">
                            {/* ✅ Manual refresh button - always visible */}
                            <button
                                onClick={handleManualRefresh}
                                disabled={notebooksLoading}
                                className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                                title="Refresh notebooks"
                            >
                                <RefreshCw size={14} className={notebooksLoading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            
                            {/* ✅ Only show Online Search if user has permission */}
                            {canCreate && (
                                <button
                                    onClick={() => setShowSearchModal(true)}
                                    className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium flex items-center gap-1.5"
                                >
                                    <Search size={14} />
                                    Online Search
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {error && (
                        <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs text-red-800 dark:text-red-300">{error}</p>
                            <button 
                                onClick={handleManualRefresh}
                                className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                    
                    <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Labno
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Added By
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Date Added
                                </th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {notebooksLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-xs">Loading notebooks...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : recentNotebookEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={28} className="opacity-50" />
                                            <p className="text-xs">No notebook entries found</p>
                                            <p className="text-xs text-gray-400">Click "Online Search" to find patients and add notebooks</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recentNotebookEntries.map((entry, idx) => (
                                    <tr key={`${entry.labno}-${entry.createDate}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                                            {entry.labno}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                                            {`${entry.fname} ${entry.lname}`.trim()}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                                            {entry.techCreate || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                                            {formatDate(entry.createDate)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => handleViewDetails({
                                                    labno: entry.labno,
                                                    labid: entry.labid || '',
                                                    fname: entry.fname,
                                                    lname: entry.lname,
                                                    sex: '',
                                                    dob: '',
                                                    birthwt: '',
                                                    submid: ''
                                                })}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <NotebookSearchModal
                isOpen={showSearchModal}
                onClose={handleCloseAll}
                onSearch={handleSearch}
            />

            <NotebookResultsModal
                isOpen={showResultsModal}
                onClose={handleCloseAll}
                onBack={handleBackToSearch}
                onViewDetails={handleViewDetails}
                results={searchResults}
                loading={loading}
            />

            {/* ✅ Pass onNotebookAdded callback to NotebookDetailsModal */}
            <NotebookDetailsModal
                isOpen={showDetailsModal}
                onClose={handleCloseAll}
                onBackToResults={handleBackToResults}
                onBackToSearch={handleBackToSearch}
                patient={selectedPatient}
                loading={detailsLoading}
                onNotebookAdded={handleNotebookAdded}
            />
        </>
    );
};