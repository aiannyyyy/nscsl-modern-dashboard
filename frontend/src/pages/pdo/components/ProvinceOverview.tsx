import React from 'react';
import ProvinceCard from './ProvinceCard';

interface ProvinceStats {
  facilities: number;
  samples: number;
  unsatRate: string;
}

interface ProvinceOverviewProps {
  provincesData: Record<string, ProvinceStats | null>;
  onSelectProvince: (province: string) => void;
  selectedProvince?: string;
}

const ProvinceOverview: React.FC<ProvinceOverviewProps> = ({
  provincesData,
  onSelectProvince,
  selectedProvince,
}) => {
  const provinces = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon'];

  return (
    <div
      className="
        grid grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-5
        gap-4 mb-8
        transition-colors
      "
    >
      {provinces.map((province) => (
        <ProvinceCard
          key={province}
          name={province}
          stats={provincesData[province]}
          onSelect={onSelectProvince}
          isSelected={selectedProvince === province}
        />
      ))}
    </div>
  );
};

export default ProvinceOverview;
