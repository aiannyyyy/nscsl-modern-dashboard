import React, { useState, useEffect, useMemo } from 'react';
import {
  getNsfPerformance,
  getNsfPerformanceLabDetails,
  type NsfPerformanceData,
  type LabDetailsData,
} from '../../services/nsfPerformanceApi';
import FilterSection from './components/FilterSection';
import ProvinceOverview from './components/ProvinceOverview';
import FacilitiesList from './components/FacilitiesList';
import PerformanceOverview from './components/PerformanceOverview';
import LabDetailsModal from './components/LabDetailsModal';

interface ProvinceStats {
  facilities: number;
  samples: number;
  unsatRate: string;
}

const NSFPerformance: React.FC = () => {
  const getDefaultDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return { start, end };
  };

  const defaultDates = getDefaultDates();

  const [selectedProvince, setSelectedProvince] = useState('batangas');
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allProvincesData, setAllProvincesData] = useState<Record<string, NsfPerformanceData[]>>({});
  const [currentFacilities, setCurrentFacilities] = useState<NsfPerformanceData[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<NsfPerformanceData | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [labDetails, setLabDetails] = useState<LabDetailsData[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState('');

  const [showPerformanceView, setShowPerformanceView] = useState(false);

  const provinceStats = useMemo(() => {
    const provinces = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon'];
    const stats: Record<string, ProvinceStats | null> = {};

    provinces.forEach((province) => {
      const data = allProvincesData[province];
      if (data?.length) {
        const samples = data.reduce((s, f) => s + f.TOTAL_SAMPLE_COUNT, 0);
        const unsat = data.reduce((s, f) => s + f.TOTAL_UNSAT_COUNT, 0);

        stats[province] = {
          facilities: data.length,
          samples,
          unsatRate: samples ? `${((unsat / samples) * 100).toFixed(1)}%` : '0.0%',
        };
      } else {
        stats[province] = null;
      }
    });

    return stats;
  }, [allProvincesData]);

  const fetchProvinceData = async (province: string) => {
    const res = await getNsfPerformance({
      county: province,
      dateFrom: startDate,
      dateTo: endDate,
    });
    return res.success ? res.data : [];
  };

  const fetchAllProvincesData = async () => {
    const provinces = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon'];
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(provinces.map(fetchProvinceData));
      const map: Record<string, NsfPerformanceData[]> = {};
      results.forEach((d, i) => (map[provinces[i]] = d));
      setAllProvincesData(map);
      setCurrentFacilities(map[selectedProvince] || []);
    } catch {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetricClick = async (category: string) => {
    if (!selectedFacility) return;

    setModalCategory(category);
    setShowModal(true);
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await getNsfPerformanceLabDetails({
        submid: selectedFacility.SUBMID.toString(),
        dateFrom: startDate,
        dateTo: endDate,
      });

      if (!res.success) throw new Error();

      let data = res.data;
      
      if (category !== 'all') {
        // Birth category filters (HOB, Homebirth, Inborn, Outborn, Unknown)
        if (category === 'hob') {
          data = data.filter((i) => i.BIRTH_CATEGORY === 'HOB');
        } else if (category === 'homebirth') {
          data = data.filter((i) => i.BIRTH_CATEGORY === 'HOMEBIRTH');
        } else if (category === 'inborn') {
          data = data.filter((i) => i.BIRTH_CATEGORY === 'INBORN');
        } else if (category === 'outborn') {
          data = data.filter((i) => i.BIRTH_CATEGORY !== 'INBORN');
        } else if (category === 'unknown') {
          data = data.filter((i) => i.BIRTH_CATEGORY === 'UNKNOWN');
        }
        // Issue/Unsat filters
        else if (category === 'total_unsat') {
          data = data.filter((i) => i.ISSUE_DESCRIPTION && i.ISSUE_DESCRIPTION !== 'NORMAL');
        } else if (category === 'contaminated') {
          data = data.filter((i) => i.ISSUE_DESCRIPTION === 'CONTAMINATED');
        } else if (category === 'insufficient') {
          data = data.filter((i) => i.ISSUE_DESCRIPTION === 'INSUFFICIENT');
        } else if (category === 'less_than_24h') {
          data = data.filter((i) => i.ISSUE_DESCRIPTION === 'LESS_THAN_24_HOURS');
        } else if (category === 'data_erasures') {
          data = data.filter((i) => i.ISSUE_DESCRIPTION === 'DATA_ERASURES');
        } else if (category === 'missing_info') {
          data = data.filter((i) => i.ISSUE_DESCRIPTION === 'MISSING_INFORMATION');
        }
      }

      setLabDetails(data);
    } catch {
      setModalError('Failed to load lab details');
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProvincesData();
  }, []);

  // Update current facilities when selected province changes
  useEffect(() => {
    setCurrentFacilities(allProvincesData[selectedProvince] || []);
  }, [selectedProvince, allProvincesData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors">
      {/* Header */}
      <div className="
        bg-gradient-to-r from-blue-600 to-blue-800
        dark:from-gray-800 dark:to-gray-700
        rounded-lg shadow-lg p-6 mb-6 text-white
      ">
        <h1 className="text-3xl font-bold mb-2">
          UNFIT AND UNSAT FACILITY PERFORMANCE
        </h1>
        <p className="text-blue-100 dark:text-gray-300">
          Comprehensive analysis of facility performance across all provinces
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="
          bg-red-50 dark:bg-red-900/30
          border border-red-200 dark:border-red-800
          text-red-700 dark:text-red-300
          px-6 py-4 rounded-lg mb-6
        ">
          {error}
        </div>
      )}

      <FilterSection
        selectedProvince={selectedProvince}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoading}
        onProvinceChange={setSelectedProvince}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyFilters={fetchAllProvincesData}
      />

      <ProvinceOverview
        provincesData={provinceStats}
        selectedProvince={selectedProvince}
        onSelectProvince={(province) => {
          setSelectedProvince(province);
          setShowPerformanceView(false);
          setSelectedFacility(null);
        }}
      />

      {!showPerformanceView ? (
        <FacilitiesList
          facilities={currentFacilities}
          selectedProvince={selectedProvince}
          onFacilitySelect={(f) => {
            setSelectedFacility(f);
            setShowPerformanceView(true);
          }}
        />
      ) : (
        selectedFacility && (
          <PerformanceOverview
            facility={selectedFacility}
            dateFrom={startDate}
            dateTo={endDate}
            onBack={() => {
              setShowPerformanceView(false);
              setSelectedFacility(null);
            }}
            onMetricClick={handleMetricClick}
          />
        )
      )}

      <LabDetailsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        labDetails={labDetails}
        isLoading={modalLoading}
        error={modalError}
        facilityName={selectedFacility?.FACILITY_NAME || ''}
        dateRange={`${startDate} to ${endDate}`}
        category={modalCategory}
      />
    </div>
  );
};

export default NSFPerformance;