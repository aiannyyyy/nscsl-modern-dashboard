import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, Edit, Trash2, X, ExternalLink, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import facilityVisitsService from '../../../services/facilityVisitsService';
import type { FacilityVisit } from '../../../services/facilityVisitsService';
import { FacilityVisitModal } from './FacilityVisitModal';
import { ExportModal } from './ExportModal';

interface FacilityVisitsProps {
  onDataChange?: () => void;
}

export const FacilityVisits: React.FC<FacilityVisitsProps> = ({ onDataChange }) => {
  const [visits, setVisits] = useState<FacilityVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [editingVisit, setEditingVisit] = useState<FacilityVisit | null>(null);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await facilityVisitsService.getAll();
      setVisits(data);
      
      // CRITICAL: Call onDataChange after fetching data
      console.log('📋 Visits fetched, calling onDataChange:', typeof onDataChange);
      if (onDataChange) {
        onDataChange();
      }
    } catch (err: any) {
      console.error('Error fetching visits:', err);
      setError(err.message || 'Failed to fetch facility visits');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (visit: FacilityVisit) => {
    setEditingVisit(visit);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this facility visit?')) {
      return;
    }

    try {
      await facilityVisitsService.delete(id);
      console.log('🗑️ Visit deleted, fetching updated list');
      await fetchVisits(); // This will trigger onDataChange
    } catch (err: any) {
      console.error('Error deleting visit:', err);
      alert('Failed to delete facility visit');
    }
  };

  const handleViewAttachments = (attachmentPath: string) => {
    const files = attachmentPath.split(',').map(f => f.trim());
    setSelectedAttachments(files);
    setShowAttachmentModal(true);
  };

  const handleDownloadFile = (filePath: string) => {
    const downloadUrl = `http://localhost:5000/${filePath}`;
    console.log('📂 Opening file:', downloadUrl);
    window.open(downloadUrl, '_blank');
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingVisit(null);
  };

  const handleModalSuccess = () => {
    console.log('🔄 Modal success - fetching visits and triggering chart refresh');
    fetchVisits(); // This will trigger onDataChange inside fetchVisits
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '1':
        return (
          <div title="Active" className="inline-flex">
            <CheckCircle 
              size={20} 
              className="text-green-600 dark:text-green-400"
            />
          </div>
        );
      case '0':
        return (
          <div title="Inactive" className="inline-flex">
            <AlertCircle 
              size={20} 
              className="text-yellow-600 dark:text-yellow-400"
            />
          </div>
        );
      case '2':
        return (
          <div title="Closed" className="inline-flex">
            <XCircle 
              size={20} 
              className="text-gray-600 dark:text-gray-400"
            />
          </div>
        );
      default:
        return <span className="text-gray-400">?</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors h-full flex flex-col">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Facility Visits
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                <Plus size={16} />
                Add Visit
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table Container - Scrollable */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Facility Name
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Date Visited
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Province
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Remarks
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      File
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        No facility visits found
                      </td>
                    </tr>
                  ) : (
                    visits.map((visit) => (
                      <tr
                        key={visit.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {visit.facility_code}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">
                          {visit.facility_name}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(visit.date_visited)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {visit.province}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300 max-w-xs truncate">
                          {visit.remarks || 'No remarks'}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {visit.attachment_path ? (
                            <button 
                              onClick={() => handleViewAttachments(visit.attachment_path!)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors"
                              title="View attachments"
                            >
                              <FileText size={16} />
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[10px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <div className="flex justify-center">
                            {getStatusIcon(visit.status)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(visit)}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => visit.id && handleDelete(visit.id)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FacilityVisitModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        visit={editingVisit}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Attachment Viewer Modal */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attachments ({selectedAttachments.length})
              </h3>
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="space-y-2">
                {selectedAttachments.map((filePath, index) => {
                  const fileName = filePath.split('/').pop() || 'Unknown file';
                  const fileExtension = fileName.split('.').pop()?.toLowerCase();
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText size={20} className="text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fileExtension?.toUpperCase()} file
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(filePath)}
                        className="ml-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs flex-shrink-0"
                      >
                        <ExternalLink size={14} />
                        Open
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};