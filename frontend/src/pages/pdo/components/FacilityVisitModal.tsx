import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import facilityVisitsService from '../../../services/facilityVisitsService';
import type { FacilityVisit } from '../../../services/facilityVisitsService';
import { useAuth } from '../../../hooks/useAuth';  // ⭐ ADDED

interface FacilityVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visit?: FacilityVisit | null;
}

export const FacilityVisitModal: React.FC<FacilityVisitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  visit,
}) => {
  const { user } = useAuth();  // ⭐ ADDED - Get current user
  
  const [formData, setFormData] = useState({
    facility_code: '',
    facility_name: '',
    date_visited: '',
    province: '',
    status: '1',
    remarks: '',
    mark: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (visit) {
      // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
      const formatDateTimeForInput = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        facility_code: visit.facility_code || '',
        facility_name: visit.facility_name || '',
        date_visited: visit.date_visited ? formatDateTimeForInput(visit.date_visited) : '',
        province: visit.province || '',
        status: visit.status || '1',
        remarks: visit.remarks || '',
        mark: visit.mark || '',
      });

      if (visit.attachment_path) {
        setExistingFiles(visit.attachment_path.split(','));
      }
    } else {
      resetForm();
    }
  }, [visit]);

  const resetForm = () => {
    setFormData({
      facility_code: '',
      facility_name: '',
      date_visited: '',
      province: '',
      status: '1',
      remarks: '',
      mark: '',
    });
    setFiles([]);
    setExistingFiles([]);
    setFilesToDelete([]);
  };

  const handleFacilityCodeKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const facilityCode = formData.facility_code.trim();
      
      if (!facilityCode) {
        alert('Please enter a facility code');
        return;
      }

      setLookupLoading(true);
      try {
        const result = await facilityVisitsService.lookupFacility(facilityCode);
        
        if (result) {
          setFormData(prev => ({
            ...prev,
            facility_name: result.facilityname,
            province: result.province,
          }));
        } else {
          alert('Facility not found. Please check the facility code.');
        }
      } catch (error) {
        console.error('Lookup error:', error);
        alert('Failed to lookup facility. Please try again.');
      } finally {
        setLookupLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (filePath: string) => {
    setFilesToDelete(prev => [...prev, filePath]);
    setExistingFiles(prev => prev.filter(f => f !== filePath));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const submitData = new FormData();
        
        // Append form fields
        Object.entries(formData).forEach(([key, value]) => {
          submitData.append(key, value);
        });

        // ⭐ ADDED - Append username from auth context
        submitData.append('userName', user?.name || 'Unknown User');

        // Append new files
        files.forEach(file => {
          submitData.append('attachments', file);
        });

        if (visit?.id) {
          // Update mode
          const filesToKeep = existingFiles.filter(f => !filesToDelete.includes(f));
          submitData.append('files_to_keep', JSON.stringify(filesToKeep));
          submitData.append('files_to_delete', JSON.stringify(filesToDelete));
          
          await facilityVisitsService.update(visit.id, submitData);
        } else {
          // Create mode
          await facilityVisitsService.create(submitData);
        }

        resetForm();
        onSuccess();
        onClose();
        
    } catch (error: any) {
        console.error('Submit error:', error);
        alert(error.message || 'Failed to save facility visit');
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {visit ? 'Edit Facility Visit' : 'Add Facility Visit'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-3">
            {/* Facility Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Facility Code <span className="text-red-500">*</span>
                <span className="text-[10px] text-gray-500 ml-1">(Press Enter to lookup)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="facility_code"
                  value={formData.facility_code}
                  onChange={handleChange}
                  onKeyPress={handleFacilityCodeKeyPress}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                />
                {lookupLoading && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Facility Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Facility Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="facility_name"
                value={formData.facility_name}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
                readOnly={lookupLoading}
              />
            </div>

            {/* Two Columns: Province & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                  readOnly={lookupLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                  <option value="2">Closed</option>
                </select>
              </div>
            </div>

            {/* Date Visited */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date & Time Visited <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="date_visited"
                value={formData.date_visited}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            {/* Two Columns: Remarks & Mark */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mark
                </label>
                <input
                  type="text"
                  name="mark"
                  value={formData.mark}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Existing Files */}
            {existingFiles.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Current Attachments
                </label>
                <div className="space-y-1.5">
                  {existingFiles.map((filePath, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {filePath.split('/').pop()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFile(filePath)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Attachments
              </label>
              <div className="flex justify-center px-4 py-4 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md hover:border-blue-500 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-1 flex text-xs text-gray-600 dark:text-gray-400">
                    <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload files</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                </div>
              </div>

              {/* New Files Preview */}
              {files.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-md"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || lookupLoading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {visit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};