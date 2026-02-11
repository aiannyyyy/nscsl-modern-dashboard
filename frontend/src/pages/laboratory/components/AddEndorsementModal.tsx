import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, Loader2, Search } from 'lucide-react';
import type { EndorsementRecord } from './EndorsementTable';
import { useAuth } from '../../../hooks/useAuth';
import {
  useLookupLabNumber,
  useCreateEndorsement,
  useUpdateEndorsement,
  createEndorsementFormData,
  type EndorsementData,
} from '../../../hooks/LaboratoryHooks';

interface AddEndorsementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record?: EndorsementRecord | null;
}

export const AddEndorsementModal: React.FC<AddEndorsementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    labNumber: '',
    firstName: '',
    lastName: '',
    facilityCode: '',
    facilityName: '',
    testResult: '',
    remarks: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [shouldLookup, setShouldLookup] = useState(false);

  // API Hooks
  const { data: lookupData, isLoading: lookupLoading, refetch: refetchLookup } = useLookupLabNumber(
    formData.labNumber,
    shouldLookup
  );
  const createMutation = useCreateEndorsement();
  const updateMutation = useUpdateEndorsement();

  useEffect(() => {
    if (record) {
      setFormData({
        labNumber: record.labNumber || '',
        firstName: record.firstName || '',
        lastName: record.lastName || '',
        facilityCode: record.facilityCode || '',
        facilityName: record.facilityName || '',
        testResult: record.testResult || '',
        remarks: record.remarks || '',
      });

      if (record.attachmentPath) {
        setExistingFiles(record.attachmentPath.split(',').map(f => f.trim()));
      }
    } else {
      resetForm();
    }
  }, [record]);

  // Handle lookup data
  useEffect(() => {
    if (lookupData && lookupData.success && lookupData.data) {
      setFormData(prev => ({
        ...prev,
        firstName: lookupData.data!.firstName,
        lastName: lookupData.data!.lastName,
        facilityCode: lookupData.data!.facilityCode,
        facilityName: lookupData.data!.facilityName,
        testResult: lookupData.data!.testResult,
      }));
      setShouldLookup(false);
    } else if (lookupData && !lookupData.success) {
      alert(lookupData.error || 'Lab number not found');
      setShouldLookup(false);
    }
  }, [lookupData]);

  const resetForm = () => {
    setFormData({
      labNumber: '',
      firstName: '',
      lastName: '',
      facilityCode: '',
      facilityName: '',
      testResult: '',
      remarks: '',
    });
    setFiles([]);
    setExistingFiles([]);
    setFilesToDelete([]);
    setShouldLookup(false);
  };

  const handleLabNumberLookup = async () => {
    const labNumber = formData.labNumber.trim();
    
    if (!labNumber) {
      alert('Please enter a lab number');
      return;
    }

    setShouldLookup(true);
    refetchLookup();
  };

  const handleLabNumberKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleLabNumberLookup();
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

    try {
      // Prepare endorsement data
      const endorsementData: EndorsementData = {
        labno: formData.labNumber,
        fname: formData.firstName,
        lname: formData.lastName,
        facility_code: formData.facilityCode,
        facility_name: formData.facilityName,
        test_result: formData.testResult,
        remarks: formData.remarks,
        endorsed_by: user?.name || 'Unknown User',
        status: 1,
      };

      if (record?.id) {
        // Update mode
        const filesToKeep = existingFiles.filter(f => !filesToDelete.includes(f));
        const formDataToSend = createEndorsementFormData(
          { ...endorsementData, modified_by: user?.name || 'Unknown User' },
          files,
          filesToKeep,
          filesToDelete
        );
        
        await updateMutation.mutateAsync({ id: record.id, data: formDataToSend });
        alert('Endorsement updated successfully');
      } else {
        // Create mode
        const formDataToSend = createEndorsementFormData(endorsementData, files);
        
        await createMutation.mutateAsync(formDataToSend);
        alert('Endorsement created successfully');
      }

      resetForm();
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.response?.data?.message || error.message || 'Failed to save endorsement');
    }
  };

  if (!isOpen) return null;

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {record ? 'Edit Endorsement' : 'Add Endorsement'}
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
            {/* Info Alert */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> After you input this entry and click save, the endorsement will be sent to the PDO.
              </p>
            </div>

            {/* Lab Number */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Laboratory Number <span className="text-red-500">*</span>
                <span className="text-[10px] text-gray-500 ml-1">(Press Enter to lookup)</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    name="labNumber"
                    value={formData.labNumber}
                    onChange={handleChange}
                    onKeyPress={handleLabNumberKeyPress}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter lab number and press Enter"
                    required
                    disabled={!!record} // Disable if editing
                  />
                  {lookupLoading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLabNumberLookup}
                  disabled={lookupLoading || !!record}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>

            {/* Name Fields and Test Result */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Result
                </label>
                <input
                  type="text"
                  name="testResult"
                  value={formData.testResult}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
            </div>

            {/* Facility Fields */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Facility Code
                </label>
                <input
                  type="text"
                  name="facilityCode"
                  value={formData.facilityCode}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <div className="col-span-8">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  name="facilityName"
                  value={formData.facilityName}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
            </div>

            {/* Remarks - Full Width with Height */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                placeholder="Enter your remarks"
                required
              />
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
                Attachment (PDF/Image/Other)
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
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    PDF, Images (JPG, PNG, GIF), Word documents. Max size: 10MB
                  </p>
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
                        <div className="min-w-0 flex-1">
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate block">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
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
              disabled={loading}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || lookupLoading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {record ? 'Update Endorsement' : 'Save Endorsement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};