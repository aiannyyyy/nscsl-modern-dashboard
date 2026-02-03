import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import facilityVisitsService from '../../../services/facilityVisitsService';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date must be before end date');
            return;
        }

        setLoading(true);

        try {
            // Fetch all visits
            const allVisits = await facilityVisitsService.getAll();

            // Filter by date range
            const filteredVisits = allVisits.filter(visit => {
                const visitDate = new Date(visit.date_visited);
                return visitDate >= new Date(startDate) && visitDate <= new Date(endDate);
            });

            if (filteredVisits.length === 0) {
                alert('No facility visits found in the selected date range');
                setLoading(false);
                return;
            }

            // Convert to CSV
            const headers = ['Facility Code', 'Facility Name', 'Date Visited', 'Province', 'Status', 'Remarks', 'Has Attachments'];
            const csvData = filteredVisits.map(visit => [
                visit.facility_code,
                visit.facility_name,
                new Date(visit.date_visited).toLocaleString(),
                visit.province,
                visit.status === '1' ? 'Active' : visit.status === '0' ? 'Inactive' : 'Closed',
                visit.remarks || 'No remarks',
                visit.attachment_path ? 'Yes' : 'No'
            ]);

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Facility_Visits_${startDate}_to_${endDate}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            alert('Export successful!');
            onClose();
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-sm">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Export Data
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <X size={18} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleExport} className="p-4 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date
                        </label>
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date
                        </label>
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            Select date range to export visits
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download size={14} />
                                    Export CSV
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};