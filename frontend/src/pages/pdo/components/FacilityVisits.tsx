import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, Edit, Trash2, X, Eye } from 'lucide-react';
import facilityVisitsService from '../../../services/PDOServices/facilityVisitsService';
import type { FacilityVisit } from '../../../services/PDOServices/facilityVisitsService';
import { FacilityVisitModal } from './FacilityVisitModal';
import { ExportModal } from './ExportModal';
import { useAuth } from '../../../hooks/useAuth';

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
  const [viewingFile, setViewingFile] = useState<{ path: string; name: string; type: string } | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await facilityVisitsService.getAll();
      setVisits(data);
      
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
      await fetchVisits();
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
    console.log('📂 Downloading file:', downloadUrl);
    window.open(downloadUrl, '_blank');
  };

  const handleViewFile = (filePath: string) => {
    const fileName = filePath.split('/').pop() || 'Unknown file';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    setViewingFile({
      path: filePath,
      name: fileName,
      type: fileExtension
    });
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingVisit(null);
  };

  const handleModalSuccess = () => {
    console.log('🔄 Modal success - fetching visits and triggering chart refresh');
    fetchVisits();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '1':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
          </span>
        );
      case '0':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Inactive
          </span>
        );
      case '2':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
            Closed
          </span>
        );
      default:
        return <span className="text-gray-400">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCreatedModified = (name: string | null, date: string | null) => {
    if (!name && !date) return '—';
    if (!name) return formatDate(date!);
    if (!date) return name;
    
    return (
      <div className="text-xs">
        <div className="font-medium text-gray-900 dark:text-white">{name}</div>
        <div className="text-gray-500 dark:text-gray-400">{formatDate(date)}</div>
      </div>
    );
  };

  const renderFileViewer = () => {
    if (!viewingFile) return null;

    const fileUrl = `http://localhost:5000/${viewingFile.path}`;
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(viewingFile.type);
    const isPdf = viewingFile.type === 'pdf';

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {viewingFile.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {viewingFile.type.toUpperCase()} file
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadFile(viewingFile.path)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              >
                <Download size={14} />
                Download
              </button>
              <button
                onClick={() => setViewingFile(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 p-4">
            {isImage ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={fileUrl}
                  alt={viewingFile.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : isPdf ? (
              <iframe
                src={fileUrl}
                className="w-full h-full min-h-[600px] rounded-lg shadow-lg bg-white"
                title={viewingFile.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText size={64} className="text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Preview not available for this file type
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  {viewingFile.name}
                </p>
                <button
                  onClick={() => handleDownloadFile(viewingFile.path)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Download File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

        {/* Table Container - Scrollable with frozen action column */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto h-full">
              <table className="w-full text-xs relative">
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
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Created
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Modified
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50 dark:bg-gray-800/50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        No facility visits found
                      </td>
                    </tr>
                  ) : (
                    visits.map((visit, index) => (
                      <tr
                        key={visit.id}
                        className={`transition-colors ${
                          index % 2 === 0 
                            ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50' 
                            : 'bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                        }`}
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
                          {getStatusBadge(visit.status)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatCreatedModified(visit.created_by, visit.created_at)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatCreatedModified(visit.modified_by, visit.modified_at)}
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap sticky right-0 shadow-[-2px_0_4px_rgba(0,0,0,0.05)] ${
                          index % 2 === 0 
                            ? 'bg-white dark:bg-gray-900' 
                            : 'bg-gray-50/50 dark:bg-gray-800/30'
                        }`}>
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

      {/* Attachment List Modal */}
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
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleViewFile(filePath)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs flex-shrink-0"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadFile(filePath)}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs flex-shrink-0"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {renderFileViewer()}
    </>
  );
};