import React, { useState, useEffect } from 'react';
import type { NsfPerformanceData } from '../../../services/PDOServices/nsfPerformanceApi';
import { 
  generateNsfReport, 
  downloadReportBlob, 
  openReportInNewTab,
  validateCrystalReportsSetup,
  getReportSystemHealth  // ✅ Added to check health details
} from '../../../services/PDOServices/nsfPerformanceApi';

interface PerformanceOverviewProps {
  facility: NsfPerformanceData;
  dateFrom: string;
  dateTo: string;
  onBack: () => void;
  onMetricClick: (category: string) => void;
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
  facility,
  dateFrom,
  dateTo,
  onBack,
  onMetricClick,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crystalReportsReady, setCrystalReportsReady] = useState<boolean | null>(null);
  const [configIssues, setConfigIssues] = useState<string[]>([]);  // ✅ Added to store specific issues

  // ✅ Validate Crystal Reports setup on component mount
  useEffect(() => {
    const checkCrystalReports = async () => {
      try {
        console.log('🔍 Checking Crystal Reports health...');
        
        const isReady = await validateCrystalReportsSetup();
        setCrystalReportsReady(isReady);
        
        if (!isReady) {
          console.warn('⚠️ Crystal Reports is not properly configured');
          
          // ✅ Get health details to show user what's wrong
          try {
            const health = await getReportSystemHealth();
            console.log('📋 Health Details:', health);
            
            if (health.issues && health.issues.length > 0) {
              setConfigIssues(health.issues);
              console.warn('❌ Configuration Issues:', health.issues);
            } else {
              // Generic issues if none specified
              const genericIssues = [];
              if (health.vbnetExecutable !== 'available') {
                genericIssues.push('VB.NET executable (CrystalReportExporter.exe) not found');
              }
              if (!health.template.exists) {
                genericIssues.push(`Crystal Reports template not found: ${health.template.name}`);
              }
              if (!health.executable.exists) {
                genericIssues.push('Crystal Reports executable file is missing');
              }
              setConfigIssues(genericIssues);
            }
          } catch (healthError) {
            console.error('Failed to get health details:', healthError);
            setConfigIssues(['Unable to check system configuration']);
          }
        } else {
          console.log('✅ Crystal Reports is ready');
          setConfigIssues([]);
        }
      } catch (error) {
        console.error('❌ Failed to validate Crystal Reports:', error);
        setCrystalReportsReady(false);
        setConfigIssues(['System validation failed']);
      }
    };

    checkCrystalReports();
  }, []);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      console.log('📄 Generating Crystal Report with parameters:', {
        facilityName: facility.FACILITY_NAME,
        submid: facility.SUBMID,
        dateFrom,
        dateTo,
        generator: 'Crystal Reports (VB.NET)'
      });

      // ✅ Validate Crystal Reports setup before generating
      if (crystalReportsReady === false) {
        throw new Error('Crystal Reports is not properly configured. Please contact your system administrator.');
      }

      // ✅ Generate the Crystal Report
      const pdfBlob = await generateNsfReport({
        submid: facility.SUBMID.toString(),
        dateFrom,
        dateTo,
      });

      console.log('✅ Crystal Report generated successfully:', {
        size: `${(pdfBlob.size / 1024).toFixed(2)} KB`,
        facility: facility.FACILITY_NAME,
      });

      // Create object URL for the PDF blob
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPdfModal(true);
      
    } catch (err: any) {
      console.error('❌ Crystal Report generation failed:', err);
      
      // ✅ User-friendly error messages
      let errorMessage = 'Failed to generate Crystal Report';
      
      if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Add helpful context for common errors
      if (errorMessage.includes('timeout')) {
        errorMessage += '\n\nThe report generation is taking longer than expected. This may happen with large datasets. Please try again.';
      } else if (errorMessage.includes('not properly configured')) {
        errorMessage += '\n\nPlease ensure:\n• CrystalReportExporter.exe is installed\n• Crystal Reports template (.rpt) exists\n• Server has required permissions';
      } else if (errorMessage.includes('executable')) {
        errorMessage += '\n\nThe VB.NET executable (CrystalReportExporter.exe) is missing or cannot be accessed.';
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;

    fetch(pdfUrl)
      .then(res => res.blob())
      .then(blob => {
        downloadReportBlob(blob, {
          submid: facility.SUBMID.toString(),
          dateFrom,
          dateTo,
        });
      })
      .catch(error => {
        console.error('❌ Download failed:', error);
        setError('Failed to download PDF. Please try again.');
      });
  };

  const handleOpenInNewTab = () => {
    if (!pdfUrl) return;
    
    fetch(pdfUrl)
      .then(res => res.blob())
      .then(blob => {
        openReportInNewTab(blob);
      })
      .catch(error => {
        console.error('❌ Open in new tab failed:', error);
        setError('Failed to open PDF in new tab. Please check your popup settings.');
      });
  };

  const MetricCard = ({ value, label, clickable = false, onClick }: any) => (
    <div
      className={`text-center ${
        clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
      onClick={clickable ? onClick : undefined}
      title={clickable ? `Click to view ${label}` : ''}
    >
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );

  const UnsatMetricCard = ({ value, label, onClick, isRate = false }: any) => (
    <div
      className={`bg-white dark:bg-gray-800 p-6 rounded-lg text-center ${
        !isRate ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={!isRate ? onClick : undefined}
      title={!isRate ? `Click to view ${label}` : ''}
    >
      <div
        className={`text-3xl font-bold mb-1 ${
          isRate ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Facilities List
        </button>

        <div className="flex items-center gap-3">
          {/* ✅ Show Crystal Reports status indicator */}
          {crystalReportsReady === false && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Crystal Reports Not Ready
            </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || crystalReportsReady === false}
            className={`px-6 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
              isGenerating || crystalReportsReady === false
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-700 dark:bg-blue-600 text-white hover:bg-blue-800 dark:hover:bg-blue-500'
            }`}
            title={crystalReportsReady === false ? 'Crystal Reports is not configured' : 'Generate Crystal Reports PDF'}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Crystal Report...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* ✅ Crystal Reports Warning - UPDATED with specific issues */}
      {crystalReportsReady === false && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 dark:text-yellow-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Crystal Reports Configuration Issue
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Crystal Reports is not properly configured on the server. 
                {configIssues.length > 0 && ' Issues detected:'}
              </p>
              {configIssues.length > 0 && (
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  {configIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                Contact your system administrator for assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 dark:text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Crystal Report Generation Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1 whitespace-pre-line">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facility Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-blue-700 dark:border-blue-500">
          <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-6">
            Facility Information
          </h4>
          <div className="space-y-6">
            <MetricCard value={facility.SUBMID} label="Facility Code" />
            <MetricCard value={facility.FACILITY_NAME} label="Facility Name" />
          </div>
        </div>

        {/* Sample Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-blue-700 dark:border-blue-500">
          <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-6">
            Sample Statistics
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              value={facility.TOTAL_SAMPLE_COUNT}
              label="Total Samples"
              clickable
              onClick={() => onMetricClick('all')}
            />
            <MetricCard value={facility.AVE_AOC ?? '-'} label="Average AOC" />
            <MetricCard value={facility.TRANSIT_TIME ?? '-'} label="Avg Transit Time" />
          </div>
        </div>

        {/* Birth Classification */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-blue-700 dark:border-blue-500">
          <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-6">
            Birth Classification
          </h4>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MetricCard
              value={facility.TOTAL_INBORN}
              label="Inborn Total"
              clickable
              onClick={() => onMetricClick('inborn')}
            />
            <MetricCard
              value={facility.OUTBORN_TOTAL}
              label="Outborn Total"
              clickable
              onClick={() => onMetricClick('outborn')}
            />
            <MetricCard value={facility.INBORN_AVERAGE ?? '-'} label="Avg AOC Inborn" />
          </div>
          <MetricCard value={facility.OUTBORN_AVERAGE ?? '0.0'} label="Avg AOC Outborn" />
        </div>
      </div>

      {/* Outborn Breakdown */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border-l-4 border-yellow-400 dark:border-yellow-600">
        <h5 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-6">
          Breakdown of Outborn
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            ['homebirth', facility.TOTAL_HOMEBIRTH, 'Homebirth'],
            ['hob', facility.TOTAL_HOB, 'HOB ≠ HO'],
            ['unknown', facility.TOTAL_UNKNOWN, 'Unknown'],
          ].map(([key, value, label]) => (
            <div
              key={key}
              onClick={() => onMetricClick(key as string)}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Unsatisfactory Samples */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border-l-4 border-red-400 dark:border-red-600">
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-6">
          Unsatisfactory Samples
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <UnsatMetricCard value={facility.CONTAMINATED} label="Contaminated" onClick={() => onMetricClick('contaminated')} />
          <UnsatMetricCard value={facility.INSUFFICIENT} label="Insufficient" onClick={() => onMetricClick('insufficient')} />
          <UnsatMetricCard value={facility.LESS_THAN_24_HOURS} label="Less than 24h" onClick={() => onMetricClick('less_than_24h')} />
          <UnsatMetricCard value={facility.DATA_ERASURES} label="Data Erasures" onClick={() => onMetricClick('data_erasures')} />
          <UnsatMetricCard value={facility.MISSING_INFORMATION} label="Missing Info" onClick={() => onMetricClick('missing_info')} />
          <UnsatMetricCard value={facility.TOTAL_UNSAT_COUNT} label="Total Unsat Count" onClick={() => onMetricClick('total_unsat')} />
          <UnsatMetricCard
            value={facility.TOTAL_UNSAT_RATE ? `${facility.TOTAL_UNSAT_RATE}%` : '-'}
            label="Total Unsat Rate"
            isRate
          />
        </div>
      </div>

      {/* PDF Modal */}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleClosePdfModal}
          ></div>

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    NSF Performance Report - {facility.FACILITY_NAME}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Generated by Crystal Reports | SUBMID: {facility.SUBMID} | {dateFrom} to {dateTo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in New Tab
                  </button>
                  <button
                    onClick={handleClosePdfModal}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[calc(90vh-80px)]"
                  title="NSF Performance Report - Crystal Reports"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOverview;