import React from 'react';

interface ProvinceStats {
  facilities: number;
  samples: number;
  unsatRate: string;
}

interface ProvinceCardProps {
  name: string;
  stats: ProvinceStats | null;
  onSelect: (province: string) => void;
  isSelected?: boolean;
}

const ProvinceCard: React.FC<ProvinceCardProps> = ({
  name,
  stats,
  onSelect,
  isSelected = false,
}) => {
  const formatProvinceName = (province: string) =>
    province.charAt(0).toUpperCase() + province.slice(1);

  return (
    <div
      onClick={() => onSelect(name.toLowerCase())}
      className={`
        cursor-pointer rounded-lg p-6 transition-all
        bg-white dark:bg-gray-800
        hover:shadow-lg dark:hover:shadow-gray-900/50
        ${
          isSelected
            ? 'ring-2 ring-blue-500 shadow-md'
            : 'shadow'
        }
      `}
    >
      {/* Province Name */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full flex items-center justify-center
          bg-blue-900 dark:bg-blue-600
        ">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {formatProvinceName(name)}
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Facilities */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {stats?.facilities?.toLocaleString() ?? '-'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Facilities
          </div>
        </div>

        {/* Samples */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {stats?.samples?.toLocaleString() ?? '-'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Samples
          </div>
        </div>

        {/* Unsat Rate */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {stats?.unsatRate ?? '-'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Unsat Rate
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvinceCard;
